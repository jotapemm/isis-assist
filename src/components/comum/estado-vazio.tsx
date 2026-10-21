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
        "flex flex-col items-center rounded-3xl border border-dashed bg-card px-6 py-12 text-center sm:py-16",
        className,
      )}
    >
      {ilustracao ??
        (Icone && (
          <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
            <Icone className="size-8" strokeWidth={1.8} />
          </span>
        ))}
      <h2 className="font-heading text-2xl">{titulo}</h2>
      <p className="mt-2 max-w-md text-muted-foreground text-pretty">{descricao}</p>
      {children && <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">{children}</div>}
    </section>
  );
}

/** Selo das telas que ainda serão construídas, com a fase do plano. */
export function SeloEmBreve({ fase }: { fase: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-2 rounded-full bg-latao-suave px-3 py-1 text-xs font-bold tracking-wide text-latao uppercase">
      Chega na {fase}
    </span>
  );
}
