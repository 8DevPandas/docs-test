import { notFound } from "next/navigation";

import { DocRenderer } from "@/components/docs/doc-renderer";
import { getDocBySlug } from "@/lib/docs";

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  return <DocRenderer content={doc.content} />;
}
