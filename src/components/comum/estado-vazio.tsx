import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tela sem dados: diz o que vai aparecer aqui e qual é o próximo passo. */
export function EstadoVazio({
  icone: Icone,
  ilustracao,
  titulo,
  descricao,
  children,
  className,
}: {
  icone?: LucideIcon;
  ilustracao?: React.ReactNode;
  titulo: string;
  descricao: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col items-center rounded-3xl border bg-card px-6 py-12 text-center sm:py-16",
        className,
      )}
    >
      {ilustracao ?? (Icone && <Icone className="mb-4 size-9 text-primary" strokeWidth={1.6} aria-hidden="true" />)}
      <h2 className="font-heading text-2xl">{titulo}</h2>
      <p className="mt-2 max-w-md text-muted-foreground text-pretty">{descricao}</p>
      {children && <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{children}</div>}
    </section>
  );
}

/** Aviso das telas que ainda serão construídas, com a fase do plano. */
export function SeloEmBreve({ fase }: { fase: string }) {
  return <p className="text-sm text-muted-foreground">Previsto para a {fase}.</p>;
}
