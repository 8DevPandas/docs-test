import { auth } from "@tandem-docs/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { DocReferenceProvider } from "@/components/chat/doc-reference-context";
import { DocReferenceSheet } from "@/components/chat/doc-reference-sheet";
import { MobileHeader } from "@/components/chat/mobile-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getRequiredProject } from "@/lib/project-context";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.emailVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email)}`);
  }

  const project = await getRequiredProject();

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <TooltipProvider>
        <SidebarProvider>
          <ChatSidebar user={session.user} projectName={project.name} logoUrl={project.logoUrl} />
          <DocReferenceProvider>
            <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
              <MobileHeader projectName={project.name} />
              {children}
            </main>
            <DocReferenceSheet />
          </DocReferenceProvider>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
