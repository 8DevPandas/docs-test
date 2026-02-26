import "server-only";

import { db, schema } from "@tandem-docs/db";
import { and, eq } from "drizzle-orm";

import { getDocEntries } from "./docs-meta";
import type { DocEntry } from "./docs-meta";
import { getRequiredProject } from "./project-context";

const { document } = schema;

/**
 * Transform inter-document markdown links to /docs/[slug] routes.
 * e.g. [text](03-gestion-cambios-alcance.md) → [text](/docs/03-gestion-cambios-alcance)
 */
function transformLinks(content: string): string {
  return content
    .replace(/\]\(\.?\/?README\.md\)/g, "](/docs)")
    .replace(/\]\(\.?\/?([0-9a-z-]+)\.md\)/g, "](/docs/$1)");
}

export async function getDocBySlug(slug: string): Promise<{
  content: string;
  meta: DocEntry;
} | null> {
  const project = await getRequiredProject();

  const [doc] = await db
    .select()
    .from(document)
    .where(and(eq(document.projectId, project.id), eq(document.slug, slug)));

  if (!doc) return null;

  // Remove the "Volver al índice" navigation line (handled by our UI)
  const content = doc.content.replace(/^>\s*\[Volver al .ndice\]\(.*\)\s*\n*/m, "");

  return {
    content: transformLinks(content),
    meta: {
      slug: doc.slug,
      title: doc.title,
      description: doc.description ?? "",
    },
  };
}

export async function getDocsIndex(): Promise<string> {
  const project = await getRequiredProject();

  const [doc] = await db
    .select()
    .from(document)
    .where(and(eq(document.projectId, project.id), eq(document.slug, "README")));

  if (!doc) return "";

  return transformLinks(doc.content);
}
