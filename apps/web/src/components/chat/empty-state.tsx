import Image from "next/image";

export function EmptyState({
  onSuggestionClick,
  projectName,
  logoUrl,
}: {
  onSuggestionClick: (text: string) => void;
  projectName: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      <div className="mb-6">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={projectName}
            width={180}
            height={180}
            className="opacity-80"
          />
        ) : (
          <div className="w-[180px] h-[180px] rounded-full bg-primary/10 flex items-center justify-center opacity-80">
            <span className="text-6xl font-bold text-primary">
              {projectName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <h2 className="text-2xl font-semibold mb-2">
        Hola, ¿en qué puedo ayudarte?
      </h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Soy el asistente de documentación de {projectName}. Preguntame sobre
        cualquier tema de la documentación.
      </p>
    </div>
  );
}
