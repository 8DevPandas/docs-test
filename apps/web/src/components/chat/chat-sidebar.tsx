"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { BookOpen, MessageSquarePlus, Trash2, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { queryClient, trpc } from "@/utils/trpc";

import { ModeToggle } from "../mode-toggle";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
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
  useSidebar,
} from "../ui/sidebar";

export function ChatSidebar({
  user,
  projectName,
  logoUrl,
}: {
  user: { name: string; email: string };
  projectName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const chatsQuery = useQuery(trpc.chat.list.queryOptions());

  const deleteMutation = useMutation(
    trpc.chat.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.chat.list.queryKey() });
        window.dispatchEvent(new Event("new-chat"));
      },
      onError: () => {
        toast.error("Error al eliminar la conversación");
      },
    }),
  );

  return (
    <>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/chat" className="flex items-center gap-3">
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
            onClick={() => {
              window.dispatchEvent(new Event("new-chat"));
              setOpenMobile(false);
            }}
          >
            <MessageSquarePlus className="size-4" />
            Nueva Conversación
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground"
            render={<Link href="/docs" />}
          >
            <BookOpen className="size-4" />
            Documentación
          </Button>
        </SidebarHeader>

        <Separator />

        <SidebarContent>
          <ScrollArea className="flex-1 px-2">
            <SidebarMenu className="py-2">
              {chatsQuery.data?.map((chatItem) => {
                const isActive = pathname === `/chat/${chatItem.id}`;
                return (
                  <SidebarMenuItem key={chatItem.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="group/item w-full"
                      onClick={() => router.push(`/chat/${chatItem.id}`)}
                    >
                      <span className="truncate flex-1 text-left">{chatItem.title}</span>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteTarget(chatItem.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget(chatItem.id);
                          }
                        }}
                        className={cn(
                          "opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 cursor-pointer",
                          isActive && "opacity-100",
                        )}
                      >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {chatsQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-6 text-center">
                  Sin conversaciones aún
                </p>
              )}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Eliminar conversación"
        description="Esta acción no se puede deshacer. Se eliminará la conversación y todos sus mensajes."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate({ id: deleteTarget });
          }
        }}
      />
    </>
  );
}
