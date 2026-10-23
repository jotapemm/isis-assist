"use client";

import { Building2, House } from "lucide-react";
import { type Control, type FieldValues, type Path, useController } from "react-hook-form";
import { cn } from "@/lib/utils";
import { DESCRICAO_TIPO, TIPOS_RESIDENCIAL } from "@/modulos/apartamentos/vocabulario";

const ICONE = { EDIFICIO: Building2, CASAS: House } as const;

/** "Prédio de apartamentos" ou "Residencial de casas", em dois cartões grandes. */
export function EscolhaTipoResidencial<T extends FieldValues>({ control }: { control: Control<T> }) {
  const { field } = useController({ control, name: "tipo" as Path<T> });
  return (
    <div role="radiogroup" aria-label="Tipo do residencial" className="grid gap-2 sm:grid-cols-2">
      {TIPOS_RESIDENCIAL.map((tipo) => {
        const Icone = ICONE[tipo];
        const marcado = field.value === tipo;
        return (
          <button
            key={tipo}
            type="button"
            role="radio"
            aria-checked={marcado}
            onClick={() => field.onChange(tipo)}
            className={cn(
              "flex items-start gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors",
              marcado ? "border-primary bg-secondary" : "border-border hover:bg-muted/60",
            )}
          >
            <Icone className={cn("mt-0.5 size-5 shrink-0", marcado ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
            <span className="flex flex-col">
              <span className="font-semibold">{DESCRICAO_TIPO[tipo].rotulo}</span>
              <span className="text-sm text-muted-foreground">{DESCRICAO_TIPO[tipo].explicacao}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
