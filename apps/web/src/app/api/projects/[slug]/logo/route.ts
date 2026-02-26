import { db, schema } from "@tandem-docs/db";
import { env } from "@tandem-docs/env/server";
import { eq } from "drizzle-orm";

const { project } = schema;

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

  const contentType = req.headers.get("content-type") ?? "";

  let logoUrl: string;

  if (contentType.includes("application/json")) {
    // Accept { logoUrl: "data:image/..." } or { logoUrl: "https://..." }
    const body = await req.json();
    if (!body.logoUrl) {
      return Response.json({ error: "logoUrl is required" }, { status: 400 });
    }
    logoUrl = body.logoUrl;
  } else {
    // Accept raw image upload — convert to data URL
    const buffer = await req.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = contentType || "image/png";
    logoUrl = `data:${mimeType};base64,${base64}`;
  }

  await db
    .update(project)
    .set({ logoUrl })
    .where(eq(project.id, proj.id));

  return Response.json({ logoUrl, updated: true });
}
