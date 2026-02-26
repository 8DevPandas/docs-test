import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@tandem-docs/auth";
import { db, schema } from "@tandem-docs/db";
import { env } from "@tandem-docs/env/server";

import { getProjectSlug } from "@/lib/project-context";
import { LandingPage } from "@/components/landing-page";

export default async function RootPage() {
  const slug = await getProjectSlug();

  if (slug) {
    redirect("/chat");
  }

  const [session, projects] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.select({
      slug: schema.project.slug,
      name: schema.project.name,
      logoUrl: schema.project.logoUrl,
      repoName: schema.project.repoName,
      repoUrl: schema.project.repoUrl,
    }).from(schema.project).orderBy(schema.project.name),
  ]);

  return (
    <LandingPage
      user={session?.user ?? null}
      projects={projects}
      baseDomain={env.BASE_DOMAIN ?? null}
    />
  );
}
