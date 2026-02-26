import type { NextRequest } from "next/server";

import { auth } from "@tandem-docs/auth";

export async function createContext(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  const projectSlug = req.headers.get("x-project-slug") ?? undefined;
  return {
    session,
    projectSlug,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
