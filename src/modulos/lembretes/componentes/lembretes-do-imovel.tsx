"use client";

import { useState } from "react";
import { BellPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import type { LembreteLinha } from "../consultas";
import { grupoDoLembrete } from "../regras";
import { GavetaLembrete } from "./gaveta-lembrete";
import { LinhaLembrete } from "./linha-lembrete";

/** Aba Lembretes da página do imóvel: os dele, com concluir, editar e criar ali mesmo. */
export function LembretesDoImovel({
  apto,
  lembretes,
  tipo,
  hoje,
}: {
  apto: { id: string; identificacao: string };
  lembretes: LembreteLinha[];
  tipo: TipoResidencial;
  hoje: string;
}) {
  const v = vocabulario(tipo);
  const [aberto, setAberto] = useState<LembreteLinha | "novo" | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Button variant="outline" className="self-start" onClick={() => setAberto("novo")}>
        <BellPlus className="size-4" />
        Novo lembrete
      </Button>
      {lembretes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum lembrete {v.no} {v.nomeMinusculo(apto.identificacao)}. Vistoria, leitura de relógio, combinar uma visita…
        </p>
      ) : (
        <ul className="divide-y">
          {lembretes.map((l) => (
            <LinhaLembrete key={l.id} l={l} v={v} hoje={hoje} atrasado={grupoDoLembrete(l, hoje) === "ATRASADO"} aoAbrir={setAberto} />
          ))}
        </ul>
      )}
      <GavetaLembrete
        aberta={aberto !== null}
        lembrete={aberto === "novo" ? null : aberto}
        aptos={[apto]}
        tipo={tipo}
        hoje={hoje}
        inicial={{ apartamentoId: apto.id }}
        aoFechar={() => setAberto(null)}
      />
    </div>
  );
}
