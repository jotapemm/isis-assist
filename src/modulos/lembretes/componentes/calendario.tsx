"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, HandCoins, Plus, Repeat, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { somarDias, somarMeses } from "@/lib/datas";
import { formatarData } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import type { Vocabulario } from "@/modulos/apartamentos/vocabulario";
import { mesPorExtenso } from "@/modulos/financeiro/regras";
import type { EventoDoSistema, LembreteLinha } from "../consultas";
import { ocorrenciasNoMes, RECORRENCIA, semanasDoMes } from "../regras";

const DIAS = [
  ["D", "domingo"],
  ["S", "segunda"],
  ["T", "terça"],
  ["Q", "quarta"],
  ["Q", "quinta"],
  ["S", "sexta"],
  ["S", "sábado"],
] as const;

type Dia = { lembretes: LembreteLinha[]; eventos: EventoDoSistema[] };

/** Cor do pontinho de cada coisa no dia. */
function corDoEvento(e: EventoDoSistema, hoje: string) {
  if (e.tipo !== "ALUGUEL") return "bg-latao";
  if (e.pago) return "bg-livre";
  return e.data < hoje ? "bg-destructive" : "bg-reservado";
}

export function Calendario({
  competencia,
  hoje,
  lembretes,
  eventos,
  v,
  aoAbrir,
  aoNovo,
}: {
  competencia: string;
  hoje: string;
  lembretes: LembreteLinha[];
  eventos: EventoDoSistema[];
  v: Vocabulario;
  aoAbrir: (l: LembreteLinha) => void;
  aoNovo: (data: string) => void;
}) {
  const fim = somarDias(somarMeses(competencia, 1), -1);
  const doMes = hoje.slice(0, 7) === competencia.slice(0, 7);
  const [escolhido, setEscolhido] = useState(doMes ? hoje : competencia);

  // Junta, por dia, os lembretes (com as repetições projetadas) e os avisos do sistema.
  const porDia = new Map<string, Dia>();
  const no = (data: string) => {
    if (!porDia.has(data)) porDia.set(data, { lembretes: [], eventos: [] });
    return porDia.get(data)!;
  };
  for (const l of lembretes) for (const data of ocorrenciasNoMes(l, competencia, fim)) no(data).lembretes.push(l);
  for (const e of eventos) no(e.data).eventos.push(e);
  const dia = porDia.get(escolhido) ?? { lembretes: [], eventos: [] };
  const mes = (n: number) => `/lembretes?ver=calendario&mes=${somarMeses(competencia, n).slice(0, 7)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Mês anterior">
          <Link href={mes(-1)}>
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <p className="min-w-44 text-center font-heading text-xl first-letter:uppercase">{mesPorExtenso(competencia)}</p>
        <Button asChild variant="outline" size="icon" aria-label="Próximo mês">
          <Link href={mes(1)}>
            <ChevronRight className="size-5" />
          </Link>
        </Button>
        {!doMes && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/lembretes?ver=calendario">Hoje</Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <table className="w-full table-fixed border-separate border-spacing-1 rounded-2xl border bg-card p-1 sm:p-2">
          <thead>
            <tr>
              {DIAS.map(([letra, nome]) => (
                <th key={nome} scope="col" className="pb-1 text-xs font-semibold text-muted-foreground">
                  <abbr title={nome} className="no-underline">
                    {letra}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {semanasDoMes(competencia).map((semana, i) => (
              <tr key={i}>
                {semana.map((data, j) => {
                  if (!data) return <td key={j} />;
                  const d = porDia.get(data);
                  const marcas = [
                    ...(d?.lembretes ?? []).map((l) => (l.importante ? "bg-reservado" : "bg-primary")),
                    ...(d?.eventos ?? []).map((e) => corDoEvento(e, hoje)),
                  ];
                  return (
                    <td key={j} className="p-0">
                      <button
                        type="button"
                        onClick={() => setEscolhido(data)}
                        aria-pressed={escolhido === data}
                        aria-label={`${formatarData(data)}${marcas.length ? `, ${marcas.length} ${marcas.length === 1 ? "item" : "itens"}` : ""}`}
                        className={cn(
                          "flex h-12 w-full flex-col items-center justify-start gap-1 rounded-lg pt-1.5 text-sm tabular-nums transition-colors hover:bg-muted sm:h-16",
                          data === hoje && "font-bold text-primary",
                          escolhido === data && "bg-primary/10 ring-2 ring-primary/50",
                        )}
                      >
                        {Number(data.slice(8))}
                        <span className="flex flex-wrap justify-center gap-0.5 px-0.5" aria-hidden="true">
                          {marcas.slice(0, 4).map((cor, k) => (
                            <span key={k} className={cn("size-1.5 rounded-full", cor)} />
                          ))}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <section aria-live="polite" className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading text-lg first-letter:uppercase">
              {escolhido === hoje ? "Hoje" : formatarData(escolhido)}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => aoNovo(escolhido)}>
              <Plus className="size-4" />
              Lembrete neste dia
            </Button>
          </div>
          {dia.lembretes.length + dia.eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada marcado.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {dia.lembretes.map((l) => (
                <li key={`l-${l.id}`}>
                  <button type="button" onClick={() => aoAbrir(l)} className="flex w-full items-start gap-3 py-2.5 text-left">
                    <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", l.importante ? "bg-reservado" : "bg-primary")} aria-hidden="true" />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{l.titulo}</span>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        {[l.hora, l.apartamento && v.nome(l.apartamento.identificacao)].filter(Boolean).join(" · ")}
                        {l.recorrencia !== "NENHUMA" && (
                          <>
                            <Repeat className="size-3.5" aria-hidden="true" />
                            {RECORRENCIA[l.recorrencia].curto}
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {dia.eventos.map((e) => (
                <li key={e.chave}>
                  <Link href={e.href} className="flex items-start gap-3 py-2.5 hover:text-primary">
                    <IconeEvento e={e} />
                    <span className="flex min-w-0 flex-col">
                      <span className="font-medium">{rotuloEvento(e, v)}</span>
                      <span className="text-sm text-muted-foreground">
                        {e.inquilino}
                        {e.tipo === "ALUGUEL" && (e.previsto ? " · previsto" : e.pago ? " · pago" : e.data < hoje ? " · em atraso" : " · a receber")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legenda">
        {[
          ["bg-primary", "Lembrete"],
          ["bg-reservado", "Importante / aluguel a receber"],
          ["bg-livre", "Aluguel pago"],
          ["bg-destructive", "Aluguel em atraso"],
          ["bg-latao", "Reajuste ou fim de contrato"],
        ].map(([cor, rotulo]) => (
          <li key={rotulo} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", cor)} aria-hidden="true" />
            {rotulo}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function rotuloEvento(e: EventoDoSistema, v: Vocabulario) {
  const onde = v.nomeMinusculo(e.identificacao);
  if (e.tipo === "REAJUSTE") return `Reajuste ${v.do} ${onde}`;
  if (e.tipo === "FIM_CONTRATO") return `Contrato ${v.do} ${onde} termina`;
  return `Aluguel ${v.do} ${onde}`;
}

export function IconeEvento({ e }: { e: EventoDoSistema }) {
  const Icone = e.tipo === "REAJUSTE" ? TrendingUp : e.tipo === "FIM_CONTRATO" ? CalendarClock : HandCoins;
  return <Icone className="mt-0.5 size-5 shrink-0 text-latao" aria-hidden="true" />;
}
