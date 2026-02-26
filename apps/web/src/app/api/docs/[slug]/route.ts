import { auth } from "@tandem-docs/auth";
import { headers } from "next/headers";

import { getDocBySlug } from "@/lib/docs";
import {
  generateSectionsIndex,
  getSectionLineRange,
} from "@/lib/docs-sections";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const sectionSlug = url.searchParams.get("section");

  let highlight: { startLine: number; endLine: number } | null = null;

  if (sectionSlug) {
    const index = await generateSectionsIndex();
    const docIndex = index.find((d) => d.docSlug === slug);
    if (docIndex) {
      highlight = getSectionLineRange(docIndex.sections, sectionSlug);
    }
  }

  return Response.json({
    content: doc.content,
    meta: doc.meta,
    highlight,
  });
}
