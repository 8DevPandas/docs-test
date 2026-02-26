"use client";

import { useEffect, useRef } from "react";
import { Streamdown } from "streamdown";

import { slugify } from "@/lib/docs-sections-client";

const linkClass = "text-accent underline underline-offset-2 hover:text-accent/80 transition-colors";

function DocLink({ href, children, target, rel, className, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const cls = className ? `${className} ${linkClass}` : linkClass;

  // Internal docs links: same-tab navigation (strip target/_blank)
  if (href?.startsWith("/docs")) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target={target} rel={rel} className={cls} {...rest}>
      {children}
    </a>
  );
}

export function DocRenderer({ content }: { content: string }) {
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = articleRef.current;
    if (!container) return;

    // Assign IDs to headings
    const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading) => {
      const text = heading.textContent ?? "";
      heading.id = slugify(text);
    });

    // Check for hash and highlight
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const targetHeading = container.querySelector(`#${CSS.escape(hash)}`);
    if (!targetHeading) return;

    targetHeading.classList.add("doc-ref-highlight-heading");

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

    // Scroll into view after a short delay for render
    requestAnimationFrame(() => {
      targetHeading.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [content]);

  return (
    <article ref={articleRef} className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-16">
      <Streamdown mode="static" components={{ a: DocLink }}>
        {content}
      </Streamdown>
    </article>
  );
}
