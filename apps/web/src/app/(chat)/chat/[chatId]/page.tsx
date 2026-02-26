import { auth } from "@tandem-docs/auth";
import { db, schema } from "@tandem-docs/db";

const { chat, message } = schema;
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ChatInterface } from "@/components/chat/chat-interface";
import { getRequiredProject } from "@/lib/project-context";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  const [session, currentProject] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getRequiredProject(),
  ]);

  if (!session?.user) {
    notFound();
  }

  const [[found], messages] = await Promise.all([
    db
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.id, chatId),
          eq(chat.userId, session.user.id),
          eq(chat.projectId, currentProject.id),
        ),
      ),
    db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(message.createdAt),
  ]);

  if (!found) {
    notFound();
  }

  const initialMessages = messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.createdAt,
  }));

  return <ChatInterface chatId={chatId} initialMessages={initialMessages} projectName={currentProject.name} logoUrl={currentProject.logoUrl} />;
}
