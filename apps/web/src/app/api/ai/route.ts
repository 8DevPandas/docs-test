import { google } from "@ai-sdk/google";
import {
  streamText,
  generateText,
  type UIMessage,
  convertToModelMessages,
  wrapLanguageModel,
  type LanguageModelMiddleware,
} from "ai";
import { auth } from "@tandem-docs/auth";
import { db, schema } from "@tandem-docs/db";

const { chat, message } = schema;
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { generateSectionsPrompt } from "@/lib/docs-sections";
import { getRequiredProject, getProjectName } from "@/lib/project-context";
import { buildSystemPrompt } from "@/lib/system-prompt";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages, chatId }: { messages: UIMessage[]; chatId?: string } =
    await req.json();

  const currentProject = await getRequiredProject();
  let activeChatId = chatId;

  if (!activeChatId) {
    const [newChat] = await db
      .insert(chat)
      .values({ userId: session.user.id, projectId: currentProject.id })
      .returning();
    activeChatId = newChat!.id;
  }

  const middlewares: LanguageModelMiddleware[] = [];

  if (process.env.NODE_ENV === "development") {
    const { devToolsMiddleware } = await import("@ai-sdk/devtools");
    middlewares.push(devToolsMiddleware());
  }

  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: middlewares,
  });

  const projectName = await getProjectName();
  const sectionsIndex = await generateSectionsPrompt();
  const system = `${buildSystemPrompt(projectName)}\n\n---\n\n## ÍNDICE DE SECCIONES\n\n${sectionsIndex}`;

  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(messages),
    async onFinish({ text }) {
      const userMessage = messages.filter((m) => m.role === "user").pop();
      const userText =
        userMessage?.parts
          ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ") ?? "";

      if (userText) {
        await db.insert(message).values({
          chatId: activeChatId!,
          role: "user",
          content: userText,
        });
      }

      if (text) {
        await db.insert(message).values({
          chatId: activeChatId!,
          role: "assistant",
          content: text,
        });
      }

      await db
        .update(chat)
        .set({ updatedAt: new Date() })
        .where(eq(chat.id, activeChatId!));

      const messageCount = messages.filter((m) => m.role === "user").length;
      if (messageCount <= 1 && userText) {
        try {
          const titleModel = google("gemini-2.5-flash");
          const { text: title } = await generateText({
            model: titleModel,
            prompt: `Generá un título corto (máximo 6 palabras) en español para una conversación que empieza con este mensaje: "${userText}". Respondé SOLO con el título, sin comillas ni puntuación final.`,
          });
          if (title.trim()) {
            await db
              .update(chat)
              .set({ title: title.trim().slice(0, 100) })
              .where(eq(chat.id, activeChatId!));
          }
        } catch {
          // Title generation is non-critical
        }
      }
    },
  });

  const response = result.toUIMessageStreamResponse();

  response.headers.set("X-Chat-Id", activeChatId!);

  return response;
}
