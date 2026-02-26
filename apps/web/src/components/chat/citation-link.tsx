"use client";

import { FileText } from "lucide-react";

import { useDocReference } from "./doc-reference-context";

const REF_PATTERN = /^\/ref\/([^/]+)(?:\/([^/]+))?$/;

export function CitationLink({
  href,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { open } = useDocReference();

  const match = href?.match(REF_PATTERN);

  if (!match) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2 hover:text-accent/80 transition-colors"
        {...rest}
      >
        {children}
      </a>
    );
  }

  const [, slug, sectionSlug] = match;

  return (
    <button
      type="button"
      onClick={() => open(slug!, sectionSlug ?? null)}
      data-citation
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent/15 text-accent text-sm border border-accent/20 hover:bg-accent/25 transition-colors cursor-pointer"
    >
      <FileText className="size-3.5 shrink-0" />
      <span>{children}</span>
    </button>
  );
}
