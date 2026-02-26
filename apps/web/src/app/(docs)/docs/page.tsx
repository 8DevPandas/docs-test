import { getDocsIndex } from "@/lib/docs";
import { DocRenderer } from "@/components/docs/doc-renderer";

export default async function DocsIndexPage() {
  const content = await getDocsIndex();

  return <DocRenderer content={content} />;
}
