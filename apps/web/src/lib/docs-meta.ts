import "server-only";

import { db, schema } from "@tandem-docs/db";
import { eq } from "drizzle-orm";

import { getProject } from "./project-context";

const { document } = schema;

export interface DocEntry {
  slug: string;
  title: string;
  description: string;
}

export async function getDocEntries(): Promise<DocEntry[]> {
  const project = await getProject();

  const docs = await db
    .select({
      slug: document.slug,
      title: document.title,
      description: document.description,
    })
    .from(document)
    .where(eq(document.projectId, project.id))
    .orderBy(document.sortOrder, document.slug);

  return docs
    .filter((d) => d.slug !== "README")
    .map((d) => ({
      slug: d.slug,
      title: d.title,
      description: d.description ?? "",
    }));
}
