import { db, schema } from "@tandem-docs/db";
import { env } from "@tandem-docs/env/server";
import { eq } from "drizzle-orm";

const { project } = schema;

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!env.ADMIN_API_KEY || apiKey !== env.ADMIN_API_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { slug, name, logoUrl, repoName, repoUrl } = body as {
    slug?: string;
    name?: string;
    logoUrl?: string;
    repoName?: string;
    repoUrl?: string;
  };

  if (!slug || !name) {
    return Response.json(
      { error: "slug and name are required" },
      { status: 400 },
    );
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return Response.json(
      { error: "slug must be lowercase alphanumeric with hyphens" },
      { status: 400 },
    );
  }

  // Check if project already exists
  const [existing] = await db
    .select()
    .from(project)
    .where(eq(project.slug, slug));

  if (existing) {
    const updates: Record<string, string> = {};
    if (repoName) updates.repoName = repoName;
    if (repoUrl) updates.repoUrl = repoUrl;
    if (Object.keys(updates).length > 0) {
      await db.update(project).set(updates).where(eq(project.id, existing.id));
    }
    return Response.json({ projectId: existing.id, existing: true });
  }

  const [newProject] = await db
    .insert(project)
    .values({
      slug,
      name,
      ...(logoUrl ? { logoUrl } : {}),
      ...(repoName ? { repoName } : {}),
      ...(repoUrl ? { repoUrl } : {}),
    })
    .returning();

  return Response.json({ projectId: newProject!.id, existing: false });
}
