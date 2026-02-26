import { redirect } from "next/navigation";

import { getProjectSlug } from "@/lib/project-context";
import { LandingPage } from "@/components/landing-page";

export default async function RootPage() {
  const slug = await getProjectSlug();

  if (slug) {
    redirect("/chat");
  }

  return <LandingPage />;
}
