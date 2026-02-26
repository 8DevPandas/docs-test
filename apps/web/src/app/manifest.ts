import type { MetadataRoute } from "next";
import { getProject } from "@/lib/project-context";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const project = await getProject();
  const name = project?.name ?? "Tandem Docs";

  return {
    name,
    short_name: project?.slug ?? "tandem-docs",
    description: `Asistente de documentación de ${name}`,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
