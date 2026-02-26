import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { db, schema } from "@tandem-docs/db";
import { eq } from "drizzle-orm";

const { project } = schema;

export const getProjectSlug = cache(async () => {
  const h = await headers();
  const slug = h.get("x-project-slug");
  if (!slug) {
    throw new Error("No project slug found in request headers. Check middleware configuration.");
  }
  return slug;
});

export const getProject = cache(async () => {
  const slug = await getProjectSlug();

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

export const getProjectName = async () => {
  const p = await getProject();
  return p.name;
};
