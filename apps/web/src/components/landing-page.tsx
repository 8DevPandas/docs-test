import Link from "next/link";

export function LandingPage() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">Tandem Docs</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Documentación inteligente para tu equipo
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Convertí tu documentación en un asistente de IA que responde preguntas
            de tu equipo al instante. Setup en minutos, sin infraestructura.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="https://github.com/TandemDigital/tandem-docs"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            >
              Empezar
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          Tandem Digital
        </div>
      </footer>
    </div>
  );
}
