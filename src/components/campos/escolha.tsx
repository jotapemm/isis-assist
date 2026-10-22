"use client";

import { cn } from "@/lib/utils";

/** Botões lado a lado para escolher uma opção comum (dia 10, 12 meses, 1 aluguel) com um toque. */
export function Escolha<T extends string | number>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
  className,
}: {
  rotulo: string;
  opcoes: readonly { valor: T; rotulo: string }[];
  valor: T | null;
  aoMudar: (valor: T) => void;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className={cn("flex flex-wrap gap-2", className)}>
      {opcoes.map((opcao) => {
        const marcado = opcao.valor === valor;
        return (
          <button
            key={String(opcao.valor)}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => aoMudar(opcao.valor)}
            className={cn(
              "h-10 rounded-full border px-4 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
              marcado && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}
