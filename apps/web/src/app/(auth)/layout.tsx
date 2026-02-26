import Image from "next/image";

import { getRequiredProject } from "@/lib/project-context";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const project = await getRequiredProject();

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="mb-2">
        {project.logoUrl ? (
          <Image
            src={project.logoUrl}
            alt={project.name}
            width={180}
            height={180}
            priority
          />
        ) : (
          <div className="w-[180px] h-[180px] rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-6xl font-bold text-primary">
              {project.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
