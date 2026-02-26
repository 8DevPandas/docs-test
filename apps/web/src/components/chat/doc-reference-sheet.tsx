"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

import { useIsMobile } from "@/hooks/use-mobile";
import { slugify } from "@/lib/docs-sections-client";

import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { useDocReference } from "./doc-reference-context";

interface DocData {
  content: string;
  meta: { slug: string; title: string; description: string };
  highlight: { startLine: number; endLine: number } | null;
}

export function DocReferenceSheet() {
  const { isOpen, slug, sectionSlug, close } = useDocReference();
  const isMobile = useIsMobile();
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !slug) {
      setData(null);
      return;
    }

    setLoading(true);
    const url = sectionSlug
      ? `/api/docs/${slug}?section=${sectionSlug}`
      : `/api/docs/${slug}`;

    fetch(url)
      .then((res) => res.json())
      .then((json: DocData) => {
        setData(json);
      })
      .finally(() => setLoading(false));
  }, [isOpen, slug, sectionSlug]);

  useEffect(() => {
    if (!data || !contentRef.current) return;

    const container = contentRef.current;

    // Assign IDs to headings
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading) => {
      const text = heading.textContent ?? "";
      heading.id = slugify(text);
    });

    // Highlight the target section
    if (!sectionSlug) return;

    const targetHeading = container.querySelector(`#${CSS.escape(sectionSlug)}`);
    if (!targetHeading) return;

    targetHeading.classList.add("doc-ref-highlight-heading");

    // Highlight sibling elements until next heading of same or higher level
    const targetLevel = parseInt(targetHeading.tagName[1]!);
    let sibling = targetHeading.nextElementSibling;
    while (sibling) {
      const tagName = sibling.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tagName)) {
        const siblingLevel = parseInt(tagName[1]!);
        if (siblingLevel <= targetLevel) break;
      }
      sibling.classList.add("doc-ref-highlight");
      sibling = sibling.nextElementSibling;
    }

    // Scroll into view within the scrollable container
    requestAnimationFrame(() => {
      targetHeading.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      container
        .querySelectorAll(".doc-ref-highlight-heading, .doc-ref-highlight")
        .forEach((el) => {
          el.classList.remove("doc-ref-highlight-heading", "doc-ref-highlight");
        });
    };
  }, [data, sectionSlug]);

  const side = isMobile ? "bottom" : "right";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side={side}
        className="data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=bottom]:h-[80vh] data-[side=bottom]:max-h-[80vh]"
      >
        <SheetHeader className="flex flex-row items-center justify-between gap-2 border-b pr-12 shrink-0">
          <div className="min-w-0 flex-1">
            <SheetTitle>{data?.meta.title ?? "Cargando..."}</SheetTitle>
            <SheetDescription className="sr-only">
              {data?.meta.description ?? "Contenido del documento"}
            </SheetDescription>
          </div>
          {data && (
            <a
              href={`/docs/${slug}${sectionSlug ? `#${sectionSlug}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="size-3.5" />
                Abrir en nueva pestaña
              </Button>
            </a>
          )}
        </SheetHeader>

        <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 pt-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {data && (
            <Streamdown mode="static">{data.content}</Streamdown>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
