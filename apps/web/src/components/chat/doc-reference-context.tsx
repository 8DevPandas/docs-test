"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface DocReferenceState {
  isOpen: boolean;
  slug: string | null;
  sectionSlug: string | null;
}

interface DocReferenceContextValue extends DocReferenceState {
  open: (slug: string, sectionSlug: string | null) => void;
  close: () => void;
}

const DocReferenceContext = createContext<DocReferenceContextValue | null>(null);

export function DocReferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<DocReferenceState>({
    isOpen: false,
    slug: null,
    sectionSlug: null,
  });

  const open = useCallback((slug: string, sectionSlug: string | null) => {
    setState({ isOpen: true, slug, sectionSlug });
  }, []);

  const close = useCallback(() => {
    setState({ isOpen: false, slug: null, sectionSlug: null });
  }, []);

  return (
    <DocReferenceContext.Provider value={{ ...state, open, close }}>
      {children}
    </DocReferenceContext.Provider>
  );
}

export function useDocReference() {
  const context = useContext(DocReferenceContext);
  if (!context) {
    throw new Error("useDocReference must be used within DocReferenceProvider");
  }
  return context;
}
