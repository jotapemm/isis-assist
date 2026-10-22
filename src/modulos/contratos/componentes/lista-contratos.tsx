"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import type { ContratoResumo } from "../consultas";
import { AVISO_FIM_DIAS, AVISO_REAJUSTE_DIAS } from "../limites";
import { AvisosDePrazo, SeloContrato } from "./situacao";

type Filtro = "ativos" | "avisos" | "encerrados";

const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const temAviso = (c: ContratoResumo) =>
  (c.diasParaReajuste !== null && c.diasParaReajuste <= AVISO_REAJUSTE_DIAS) ||
  (c.diasParaFim !== null && c.diasParaFim <= AVISO_FIM_DIAS);

export function ListaContratos({ contratos, hoje }: { contratos: ContratoResumo[]; hoje: string }) {
  const [filtro, setFiltro] = useState<Filtro>("ativos");
  const [busca, setBusca] = useState("");

  const grupos: Record<Filtro, ContratoResumo[]> = {
    ativos: contratos.filter((c) => c.status === "ATIVO"),
    avisos: contratos.filter((c) => c.status === "ATIVO" && temAviso(c)),
    encerrados: contratos.filter((c) => c.status === "ENCERRADO"),
  };
  const termo = normalizar(busca.trim());
  const visiveis = grupos[filtro].filter(
    (c) => !termo || normalizar(c.inquilino.nome).includes(termo) || c.apartamento.identificacao.toLowerCase().includes(termo),
  );

  const opcoes: [Filtro, string][] = [
    ["ativos", "Ativos"],
    ["avisos", "Com aviso"],
    ["encerrados", "Encerrados"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="radiogroup" aria-label="Quais contratos" className="inline-flex gap-1 self-start rounded-xl bg-muted p-1">
          {opcoes.map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={filtro === valor}
              onClick={() => setFiltro(valor)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground",
                filtro === valor && "bg-card text-foreground shadow-sm",
              )}
            >
              {rotulo}
              <span className="tabular-nums">{grupos[valor].length}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Inquilino ou apartamento"
            aria-label="Buscar contrato"
            className="pl-9"
          />
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="rounded-2xl border bg-card px-4 py-8 text-center text-muted-foreground">
          {busca
            ? `Nenhum contrato encontrado com “${busca}”.`
            : filtro === "avisos"
              ? "Nenhum reajuste ou término chegando. Tudo em dia."
              : filtro === "encerrados"
                ? "Nenhum contrato encerrado ainda."
                : "Nenhum contrato ativo."}
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {visiveis.map((c) => (
            <li key={c.id}>
              <Link href={`/contratos/${c.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/60">
                <span className="w-14 shrink-0 font-mono text-lg font-bold tabular-nums">{c.apartamento.identificacao}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{c.inquilino.nome}</span>
                    <SeloContrato contrato={c} />
                  </span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {c.status === "ATIVO"
                      ? `${formatarMoeda(c.valorAluguel)} · dia ${c.diaVencimento} · até ${formatarData(c.dataFim)}`
                      : `${formatarData(c.dataInicio)} a ${formatarData(c.encerradoEm ?? c.dataFim)}`}
                  </span>
                  <AvisosDePrazo contrato={c} hoje={hoje} compacto />
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
