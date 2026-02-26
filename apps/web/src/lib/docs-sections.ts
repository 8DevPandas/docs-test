import "server-only";

import { db, schema } from "@tandem-docs/db";
import { eq } from "drizzle-orm";

import { slugify } from "./docs-sections-client";
import { getProject } from "./project-context";

export { slugify };

const { document } = schema;

export interface DocSection {
  slug: string;
  title: string;
  level: number;
  startLine: number;
  endLine: number;
}

export interface DocSectionsIndex {
  docSlug: string;
  docTitle: string;
  sections: DocSection[];
}

function parseSections(content: string): DocSection[] {
  const lines = content.split("\n");
  const sections: DocSection[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(/^(#{2,4})\s+(.+)$/);
    if (!match) continue;

    const level = match[1]!.length;
    const title = match[2]!.trim();
    const slug = slugify(title);

    sections.push({
      slug,
      title,
      level,
      startLine: i + 1,
      endLine: lines.length,
    });
  }

  // Set endLine for each section to the line before the next section of same or higher level
  for (let i = 0; i < sections.length; i++) {
    const current = sections[i]!;
    for (let j = i + 1; j < sections.length; j++) {
      if (sections[j]!.level <= current.level) {
        current.endLine = sections[j]!.startLine - 1;
        break;
      }
    }
  }

  return sections;
}

export async function generateSectionsIndex(): Promise<DocSectionsIndex[]> {
  const project = await getProject();

  const docs = await db
    .select({
      slug: document.slug,
      title: document.title,
      content: document.content,
    })
    .from(document)
    .where(eq(document.projectId, project.id))
    .orderBy(document.sortOrder, document.slug);

  const results: DocSectionsIndex[] = [];

  for (const doc of docs) {
    if (doc.slug === "README") continue;
    const sections = parseSections(doc.content);
    results.push({
      docSlug: doc.slug,
      docTitle: doc.title,
      sections,
    });
  }

  return results;
}

export async function generateSectionsPrompt(): Promise<string> {
  const index = await generateSectionsIndex();

  const lines: string[] = [];
  for (const doc of index) {
    lines.push(`### ${doc.docTitle} (${doc.docSlug})`);
    for (const section of doc.sections) {
      const indent = "  ".repeat(section.level - 2);
      lines.push(
        `${indent}- [${section.title}](/ref/${doc.docSlug}/${section.slug})`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function getSectionLineRange(
  sections: DocSection[],
  sectionSlug: string,
): { startLine: number; endLine: number } | null {
  const section = sections.find((s) => s.slug === sectionSlug);
  if (!section) return null;
  return { startLine: section.startLine, endLine: section.endLine };
}
