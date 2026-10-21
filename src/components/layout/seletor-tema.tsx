"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const OPCOES = [
  { valor: "light", rotulo: "Claro", icone: Sun },
  { valor: "dark", rotulo: "Escuro", icone: Moon },
  { valor: "system", rotulo: "Igual ao aparelho", icone: Monitor },
] as const;

/** Três botões lado a lado — mais fácil de entender do que um menu escondido. */
export function SeletorTema({ comRotulos = false }: { comRotulos?: boolean }) {
  const { theme, setTheme } = useTheme();
  // O tema salvo só existe no navegador; no HTML do servidor nenhum botão aparece marcado.
  const montado = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <div role="radiogroup" aria-label="Aparência" className="inline-flex gap-1 rounded-xl bg-muted p-1">
      {OPCOES.map(({ valor, rotulo, icone: Icone }) => {
        const marcado = montado && theme === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={marcado}
            aria-label={rotulo}
            title={rotulo}
            onClick={() => setTheme(valor)}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition-colors",
              marcado && "bg-card text-foreground shadow-sm",
            )}
          >
            <Icone className="size-4" />
            {comRotulos && <span>{rotulo}</span>}
          </button>
        );
      })}
    </div>
  );
}
