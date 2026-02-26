"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

export function DocsMobileHeader() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="size-5" />
      </Button>
      <span className="text-sm font-semibold">Documentación</span>
    </div>
  );
}
