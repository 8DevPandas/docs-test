import { auth } from "@tandem-docs/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DocsMobileHeader } from "@/components/docs/docs-mobile-header";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getDocEntries } from "@/lib/docs-meta";
import { getRequiredProject } from "@/lib/project-context";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, docEntries, project] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getDocEntries(),
    getRequiredProject(),
  ]);

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`);
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <DocsSidebar user={session.user} docEntries={docEntries} projectName={project.name} logoUrl={project.logoUrl} />
        <main className="flex-1 flex flex-col h-svh overflow-hidden">
          <DocsMobileHeader />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
