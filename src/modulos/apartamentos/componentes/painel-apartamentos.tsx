"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Building2, ChevronRight, House, List } from "lucide-react";
import { formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { nomeAndar, STATUS, STATUS_APARTAMENTO, type StatusApartamento } from "../status";
import { BotaoGerarLote } from "./botao-gerar-lote";
import { MapaResidencial } from "./mapa-vila";
import { SeloStatus } from "./selo-status";
import { type TipoResidencial, vocabulario } from "../vocabulario";

type Apto = {
  id: string;
  identificacao: string;
  andar: number | null;
  status: StatusApartamento;
  valorReferencia: number | null;
  quartos: number | null;
  areaM2: number | null;
  inquilino: string | null;
};

type Visao = "mapa" | "lista";
const CHAVE_VISAO = "isis:aptos:visao";

// Preferência de visão por aparelho; sem acesso ao armazenamento do navegador, fica no mapa.
const lerVisao = (): Visao => {
  try {
    return localStorage.getItem(CHAVE_VISAO) === "lista" ? "lista" : "mapa";
  } catch {
    return "mapa";
  }
};

export function PainelApartamentos({ aptos, residencial, tipo }: { aptos: Apto[]; residencial: string; tipo: TipoResidencial }) {
  const v = vocabulario(tipo);
  const [destaque, setDestaque] = useState<StatusApartamento | null>(null);
  const visaoSalva = useSyncExternalStore(() => () => {}, lerVisao, () => "mapa" as Visao);
  const [visaoEscolhida, setVisaoEscolhida] = useState<Visao | null>(null);
  const visao = visaoEscolhida ?? visaoSalva;

  function escolherVisao(nova: Visao) {
    setVisaoEscolhida(nova);
    try {
      localStorage.setItem(CHAVE_VISAO, nova);
    } catch {}
  }

  const contagem = Object.fromEntries(STATUS_APARTAMENTO.map((s) => [s, aptos.filter((a) => a.status === s).length]));
  const visiveis = destaque ? aptos.filter((a) => a.status === destaque) : aptos;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Legenda que também filtra: tocar num status destaca só aqueles aptos. */}
        <div role="group" aria-label="Destacar por status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Filtro ativo={destaque === null} onClick={() => setDestaque(null)}>
            {v.o === "a" ? "Todas" : "Todos"} <strong className="tabular-nums">{aptos.length}</strong>
          </Filtro>
          {STATUS_APARTAMENTO.filter((s) => contagem[s] > 0).map((s) => (
            <Filtro key={s} ativo={destaque === s} onClick={() => setDestaque(destaque === s ? null : s)}>
              <span className={cn("size-2.5 rounded-full", STATUS[s].ponto)} aria-hidden="true" />
              {STATUS[s].rotulo} <strong className="tabular-nums">{contagem[s]}</strong>
            </Filtro>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start">
          <BotaoGerarLote tipo={tipo} existentes={aptos.map((a) => a.identificacao)} />
          <div role="radiogroup" aria-label="Forma de ver" className="inline-flex shrink-0 gap-1 rounded-xl bg-muted p-1">
            {(
              [
                ["mapa", tipo === "CASAS" ? "Mapa" : "Fachada", tipo === "CASAS" ? House : Building2],
                ["lista", "Lista", List],
              ] as const
            ).map(([valor, rotulo, Icone]) => (
              <button
                key={valor}
                type="button"
                role="radio"
                aria-checked={visao === valor}
                onClick={() => escolherVisao(valor)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground",
                  visao === valor && "bg-card text-foreground shadow-sm",
                )}
              >
                <Icone className="size-4" aria-hidden="true" />
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      {visao === "mapa" ? (
        <MapaResidencial tipo={tipo} aptos={aptos} residencial={residencial} destaque={destaque} />
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {visiveis.map((apto) => (
            <li key={apto.id}>
              <Link href={`/apartamentos/${apto.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/60">
                <span className="w-14 shrink-0 font-mono text-lg font-bold tabular-nums">{apto.identificacao}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm text-muted-foreground">
                    {[
                      apto.inquilino ?? (tipo === "CASAS" ? null : nomeAndar(apto.andar)),
                      apto.quartos !== null && `${apto.quartos} ${apto.quartos === 1 ? "quarto" : "quartos"}`,
                      apto.areaM2 !== null && `${apto.areaM2} m²`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <SeloStatus status={apto.status} className="self-start py-0.5 text-xs sm:ml-auto sm:self-auto" />
                </span>
                {apto.valorReferencia !== null && (
                  <span className="hidden w-28 text-right tabular-nums sm:block">{formatarMoeda(apto.valorReferencia)}</span>
                )}
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filtro({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "flex h-9 shrink-0 items-center gap-2 rounded-full border bg-card px-3.5 text-sm whitespace-nowrap transition-colors hover:bg-muted",
        ativo && "border-primary bg-primary text-primary-foreground hover:bg-primary/90 [&>span]:ring-2 [&>span]:ring-primary-foreground/70",
      )}
    >
      {children}
    </button>
  );
}
