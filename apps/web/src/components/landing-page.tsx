import { ExternalLink, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "./ui/button";

interface Project {
  slug: string;
  name: string;
  logoUrl: string | null;
  repoName: string | null;
  repoUrl: string | null;
}

export function LandingPage({
  user,
  projects,
  baseDomain,
}: {
  user: { name: string; email: string } | null;
  projects: Project[];
  baseDomain: string | null;
}) {
  function projectUrl(slug: string) {
    if (!baseDomain) return "/chat";
    return `https://${slug}.${baseDomain}`;
  }

  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Tandem Docs</span>
          {user ? (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          ) : (
            <Button render={<Link href="/login" />} variant="outline" size="sm">
              Iniciar Sesión
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-bold mb-2">Proyectos</h1>
        <p className="text-muted-foreground mb-8">
          {user
            ? "Seleccioná un proyecto para acceder a su documentación y chat."
            : "Iniciá sesión para acceder a los proyectos."}
        </p>

        {user ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <a
                key={project.slug}
                href={projectUrl(project.slug)}
                className="group flex items-center gap-4 rounded-xl border p-4 hover:bg-muted/50 transition-colors"
              >
                {project.logoUrl ? (
                  <Image
                    src={project.logoUrl}
                    alt={project.name}
                    width={40}
                    height={40}
                    className="rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{project.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{project.slug}</p>
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        <ExternalLink className="size-3" />
                        {project.repoName ?? "Repo"}
                      </a>
                    )}
                  </div>
                </div>
                <MessageSquare className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </a>
            ))}
            {projects.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-12">
                No hay proyectos todavía.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <Button render={<Link href="/login" />} size="lg">
              Iniciar Sesión
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
