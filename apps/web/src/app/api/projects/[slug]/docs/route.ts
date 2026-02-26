import { db, schema } from "@tandem-docs/db";
import { env } from "@tandem-docs/env/server";
import { and, eq } from "drizzle-orm";

const { project, document } = schema;

interface DocPayload {
  slug: string;
  title: string;
  content: string;
  description?: string;
  sortOrder?: number;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const apiKey = req.headers.get("x-api-key");

  if (!env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug: projectSlug } = await params;

  const [proj] = await db
    .select()
    .from(project)
    .where(eq(project.slug, projectSlug));

  if (!proj) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();
  const { docs, replace } = body as { docs?: DocPayload[]; replace?: boolean };

  if (!docs || !Array.isArray(docs) || docs.length === 0) {
    return Response.json(
      { error: "docs array is required and must not be empty" },
      { status: 400 },
    );
  }

  // Validate each doc
  for (const doc of docs) {
    if (!doc.slug || !doc.title || !doc.content) {
      return Response.json(
        { error: `Each doc must have slug, title, and content. Missing in: ${doc.slug ?? "unknown"}` },
        { status: 400 },
      );
    }
  }

  // If replace mode, delete all existing docs for this project first
  if (replace) {
    await db.delete(document).where(eq(document.projectId, proj.id));
  }

  const results: { slug: string; action: "created" | "updated" }[] = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]!;
    const [existing] = await db
      .select({ id: document.id })
      .from(document)
      .where(and(eq(document.projectId, proj.id), eq(document.slug, doc.slug)));

    if (existing && !replace) {
      await db
        .update(document)
        .set({
          title: doc.title,
          content: doc.content,
          description: doc.description ?? "",
          sortOrder: doc.sortOrder ?? i,
        })
        .where(eq(document.id, existing.id));
      results.push({ slug: doc.slug, action: "updated" });
    } else {
      await db.insert(document).values({
        projectId: proj.id,
        slug: doc.slug,
        title: doc.title,
        content: doc.content,
        description: doc.description ?? "",
        sortOrder: doc.sortOrder ?? i,
      });
      results.push({ slug: doc.slug, action: "created" });
    }
  }

  return Response.json({ results, count: results.length });
}
