"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { somarMeses } from "@/lib/datas";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import type { CobrancaLinha, FinanceiroDoMes } from "../consultas";
import { CATEGORIAS_DESPESA, competenciaDe, mesPorExtenso, type Situacao } from "../regras";
import { GavetaCobranca } from "./gaveta-cobranca";
import { type DespesaLinha, GavetaDespesa } from "./gaveta-despesa";
import { SeloSituacao } from "./pecas";

type Aba = "alugueis" | "despesas";

// O que pede ação vem primeiro; o que já está pago, por último.
const ORDEM: Record<Situacao, number> = { ATRASADA: 0, VENCIDA: 1, VENCE_HOJE: 2, PARCIAL: 3, A_VENCER: 4, PAGA: 5, CANCELADA: 6 };
// Dentro da mesma situação, pelo vencimento.
const porSituacao = (a: CobrancaLinha, b: CobrancaLinha) => ORDEM[a.situacao] - ORDEM[b.situacao] || a.vencimento.localeCompare(b.vencimento);

export function PainelFinanceiro({
  dados,
  competencia,
  tipo,
  chavePix,
  aptos,
  abaInicial = "alugueis",
  pagarInicial,
  novaDespesaInicial = false,
}: {
  dados: FinanceiroDoMes;
  competencia: string;
  tipo: TipoResidencial;
  chavePix: string | null;
  aptos: { id: string; identificacao: string }[];
  abaInicial?: Aba;
  pagarInicial?: string;
  novaDespesaInicial?: boolean;
}) {
  const todas = [...dados.anteriores, ...dados.cobrancas];
  const [aba, setAba] = useState<Aba>(abaInicial);
  const [selecionada, setSelecionada] = useState<CobrancaLinha | null>(() => todas.find((c) => c.id === pagarInicial) ?? null);
  const [despesa, setDespesa] = useState<DespesaLinha | "nova" | null>(novaDespesaInicial ? "nova" : null);

  // A versão nova chega a cada refresh; se a cobrança saiu das listas (pagamento com data de outro
  // mês), a gaveta segue com a que foi aberta para não sumir no meio do recibo.
  const cobrancaAberta = selecionada && (todas.find((c) => c.id === selecionada.id) ?? selecionada);
  const mesAtual = competenciaDe(dados.hoje);
  const t = dados.totais;
  const progresso = t.previsto ? Math.min(100, Math.round((t.recebidoDoMes / t.previsto) * 100)) : 0;
  const ordenadas = [...dados.cobrancas].sort(porSituacao);
  const anteriores = [...dados.anteriores].sort(porSituacao);

  return (
    <div className="flex flex-col gap-6">
      {/* Mês */}
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Mês anterior">
          <Link href={`/financeiro?mes=${somarMeses(competencia, -1).slice(0, 7)}`}>
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <p className="min-w-44 text-center font-heading text-xl first-letter:uppercase">{mesPorExtenso(competencia)}</p>
        <Button asChild variant="outline" size="icon" aria-label="Próximo mês">
          <Link href={`/financeiro?mes=${somarMeses(competencia, 1).slice(0, 7)}`}>
            <ChevronRight className="size-5" />
          </Link>
        </Button>
        {competencia !== mesAtual && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/financeiro">Voltar para este mês</Link>
          </Button>
        )}
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cartao rotulo="Recebido do mês" className="col-span-2 lg:col-span-1">
          <p className="font-heading text-2xl tabular-nums">{formatarMoeda(t.recebidoDoMes)}</p>
          <p className="text-sm text-muted-foreground tabular-nums">de {formatarMoeda(t.previsto)} previstos</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100} aria-label="Quanto do mês já foi recebido">
            <div className="h-full rounded-full bg-livre" style={{ width: `${progresso}%` }} />
          </div>
        </Cartao>
        <Cartao rotulo="Em atraso">
          <p className={cn("font-heading text-2xl tabular-nums", t.emAtraso > 0 && "text-destructive")}>{formatarMoeda(t.emAtraso)}</p>
          <p className="text-sm text-muted-foreground">todos os meses</p>
        </Cartao>
        <Cartao rotulo="Despesas">
          <p className="font-heading text-2xl tabular-nums">{formatarMoeda(t.despesas)}</p>
          <p className="text-sm text-muted-foreground">neste mês</p>
        </Cartao>
        <Cartao rotulo="Saldo do mês" className="col-span-2 lg:col-span-1">
          <p className={cn("font-heading text-2xl tabular-nums", t.entradas - t.despesas < 0 && "text-destructive")}>
            {formatarMoeda(t.entradas - t.despesas)}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums">entrou {formatarMoeda(t.entradas)} − despesas</p>
        </Cartao>
      </div>

      {/* Abas */}
      <div className="flex items-center justify-between gap-3">
        <div role="radiogroup" aria-label="O que ver" className="inline-flex gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["alugueis", "Aluguéis", dados.cobrancas.length],
              ["despesas", "Despesas", dados.despesas.length],
            ] as const
          ).map(([valor, rotulo, quantos]) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={aba === valor}
              onClick={() => setAba(valor)}
              className={cn("flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground", aba === valor && "bg-card text-foreground shadow-sm")}
            >
              {rotulo} <span className="tabular-nums">{quantos}</span>
            </button>
          ))}
        </div>
        {aba === "despesas" && (
          <Button onClick={() => setDespesa("nova")}>
            <Plus className="size-4" />
            Lançar despesa
          </Button>
        )}
      </div>

      {aba === "alugueis" ? (
        <div className="flex flex-col gap-6">
          {dados.anteriores.length > 0 && (
            <ListaCobrancas titulo="De meses anteriores" cobrancas={anteriores} tipo={tipo} mostrarMes aoAbrir={setSelecionada} />
          )}
          {ordenadas.length === 0 ? (
            <p className="rounded-2xl border bg-card px-4 py-8 text-center text-muted-foreground">
              Nenhum aluguel neste mês. As cobranças aparecem sozinhas para os contratos ativos.
            </p>
          ) : (
            <ListaCobrancas titulo={dados.anteriores.length > 0 ? "Deste mês" : undefined} cobrancas={ordenadas} tipo={tipo} aoAbrir={setSelecionada} />
          )}
        </div>
      ) : dados.despesas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-4 py-10 text-center">
          <ReceiptText className="size-8 text-primary" aria-hidden="true" />
          <p className="font-medium">Nenhuma despesa neste mês</p>
          <p className="max-w-sm text-sm text-muted-foreground">Água, luz, IPTU, consertos… lançando aqui, o relatório mostra o lucro de verdade.</p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {dados.despesas.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => setDespesa(d)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60">
                <span className="w-24 shrink-0 text-sm text-muted-foreground">{CATEGORIAS_DESPESA[d.categoria]}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{d.descricao}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatarData(d.data)}
                    {d.apartamento ? ` · ${vocabulario(tipo).nome(d.apartamento.identificacao)}` : " · geral"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatarMoeda(d.valor)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <GavetaCobranca cobranca={cobrancaAberta} tipo={tipo} chavePix={chavePix} hoje={dados.hoje} aoFechar={() => setSelecionada(null)} />
      <GavetaDespesa
        aberta={despesa !== null}
        despesa={despesa === "nova" ? null : despesa}
        aptos={aptos}
        tipo={tipo}
        hoje={dados.hoje}
        aoFechar={() => setDespesa(null)}
      />
    </div>
  );
}

function Cartao({ rotulo, className, children }: { rotulo: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("flex flex-col rounded-2xl border bg-card p-4", className)}>
      <h2 className="mb-1 text-sm font-medium text-muted-foreground">{rotulo}</h2>
      {children}
    </section>
  );
}

function ListaCobrancas({
  titulo,
  cobrancas,
  tipo,
  mostrarMes = false,
  aoAbrir,
}: {
  titulo?: string;
  cobrancas: CobrancaLinha[];
  tipo: TipoResidencial;
  mostrarMes?: boolean;
  aoAbrir: (cobranca: CobrancaLinha) => void;
}) {
  const v = vocabulario(tipo);
  return (
    <section className="flex flex-col gap-2">
      {titulo && <h2 className="font-heading text-lg">{titulo}</h2>}
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
        {cobrancas.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => aoAbrir(c)}
              aria-label={`${v.nome(c.apartamento.identificacao)}, ${c.inquilino.nome}`}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60"
            >
              <span className="w-12 shrink-0 font-mono text-lg font-bold tabular-nums">{c.apartamento.identificacao}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{c.inquilino.nome}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {mostrarMes && <span className="first-letter:uppercase">{mesPorExtenso(c.competencia)} · </span>}
                  vence {formatarData(c.vencimento).slice(0, 5)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className="tabular-nums">{formatarMoeda(c.aberto > 0 ? c.aberto : c.valor)}</span>
                <SeloSituacao situacao={c.situacao} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
