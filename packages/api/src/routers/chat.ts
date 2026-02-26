import { db, schema } from "@tandem-docs/db";

const { chat, message, project } = schema;
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

async function getProjectId(slug: string | undefined): Promise<string> {
  if (!slug) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No project slug provided",
    });
  }

  const [found] = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.slug, slug));

  if (!found) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Project "${slug}" not found`,
    });
  }

  return found.id;
}

export const chatRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const projectId = await getProjectId(ctx.projectSlug);
    return db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })
      .from(chat)
      .where(and(eq(chat.userId, ctx.session.user.id), eq(chat.projectId, projectId)))
      .orderBy(desc(chat.updatedAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const projectId = await getProjectId(ctx.projectSlug);
      const [found] = await db
        .select()
        .from(chat)
        .where(
          and(
            eq(chat.id, input.id),
            eq(chat.userId, ctx.session.user.id),
            eq(chat.projectId, projectId),
          ),
        );

      if (!found) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }

      const messages = await db
        .select()
        .from(message)
        .where(eq(message.chatId, input.id))
        .orderBy(message.createdAt);

      return { ...found, messages };
    }),

  create: protectedProcedure.mutation(async ({ ctx }) => {
    const projectId = await getProjectId(ctx.projectSlug);
    const [newChat] = await db
      .insert(chat)
      .values({ userId: ctx.session.user.id, projectId })
      .returning();
    return newChat!;
  }),

  updateTitle: protectedProcedure
    .input(z.object({ id: z.string(), title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const projectId = await getProjectId(ctx.projectSlug);
      const [updated] = await db
        .update(chat)
        .set({ title: input.title })
        .where(
          and(
            eq(chat.id, input.id),
            eq(chat.userId, ctx.session.user.id),
            eq(chat.projectId, projectId),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const projectId = await getProjectId(ctx.projectSlug);
      const [deleted] = await db
        .delete(chat)
        .where(
          and(
            eq(chat.id, input.id),
            eq(chat.userId, ctx.session.user.id),
            eq(chat.projectId, projectId),
          ),
        )
        .returning();

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }
      return { success: true };
    }),
});
