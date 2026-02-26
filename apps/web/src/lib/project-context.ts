import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { db, schema } from "@tandem-docs/db";
import { eq } from "drizzle-orm";

const { project } = schema;

export const getProjectSlug = cache(async (): Promise<string | null> => {
  const h = await headers();
  return h.get("x-project-slug");
});

export const getProject = cache(async () => {
  const slug = await getProjectSlug();
  if (!slug) return null;

  const [found] = await db
    .select()
    .from(project)
    .where(eq(project.slug, slug));

  if (!found) {
    throw new Error(
      `Project with slug "${slug}" not found. Run the seed script to create it.`,
    );
  }

  return found;
});

/** Returns the project or throws — use in routes that require a project */
export const getRequiredProject = cache(async () => {
  const p = await getProject();
  if (!p) {
    throw new Error("No project found. This route requires a project subdomain.");
  }
  return p;
});

export const getProjectName = async () => {
  const p = await getProject();
  return p?.name ?? "Tandem Docs";
};
