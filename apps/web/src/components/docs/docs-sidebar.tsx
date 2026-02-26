"use client";

import { BookOpen, ExternalLink, LogOut, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { DocEntry } from "@/lib/docs-meta";
import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";

export function DocsSidebar({
  user,
  docEntries,
  projectName,
  logoUrl,
  repoName,
  repoUrl,
}: {
  user: { name: string; email: string };
  docEntries: DocEntry[];
  projectName: string;
  logoUrl?: string | null;
  repoName?: string | null;
  repoUrl?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/docs" className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt={projectName} width={32} height={32} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{projectName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="font-semibold text-lg">{projectName}</span>
        </Link>
        <Button
          variant="outline"
          className="w-full mt-3 justify-start gap-2"
          render={<Link href="/chat" />}
        >
          <MessageSquare className="size-4" />
          Ir al Chat
        </Button>
        {repoUrl && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            render={<a href={repoUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="size-4" />
            {repoName ?? "Repositorio"}
          </Button>
        )}
      </SidebarHeader>

      <Separator />

      <SidebarContent>
        <ScrollArea className="flex-1 px-2">
          <SidebarMenu className="py-2">
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname === "/docs"} render={<Link href="/docs" />}>
                <BookOpen className="size-4" />
                <span className="truncate">Índice General</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {docEntries.map((doc) => {
              const isActive = pathname === `/docs/${doc.slug}`;
              return (
                <SidebarMenuItem key={doc.slug}>
                  <SidebarMenuButton isActive={isActive} render={<Link href={`/docs/${doc.slug}`} />}>
                    <span className="truncate">{doc.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </ScrollArea>
      </SidebarContent>

      <Separator />

      <SidebarFooter className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => router.push("/login"),
                  },
                });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
