import Link from "next/link";
import { ArrowRight, FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { nomeDoMes } from "@/modulos/financeiro/regras";
import type { NumerosDoPainel } from "../consultas";
import { GraficoDozeMeses } from "./grafico-doze-meses";

/** Os três números do mês, logo abaixo da saudação. */
export function NumerosDoMes({ n }: { n: NumerosDoPainel }) {
  const progresso = n.mes.previsto ? Math.min(100, Math.round((n.mes.recebido / n.mes.previsto) * 100)) : 0;
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
      <Link href="/financeiro" className="col-span-2 flex flex-col rounded-2xl border bg-card p-4 hover:bg-muted/40 lg:col-span-1">
        <span className="text-sm font-medium text-muted-foreground">Recebido em {nomeDoMes(`${n.hoje.slice(0, 7)}-01`)}</span>
        <span className="font-heading text-2xl tabular-nums">{formatarMoeda(n.mes.recebido)}</span>
        <span className="text-sm text-muted-foreground tabular-nums">de {formatarMoeda(n.mes.previsto)} previstos</span>
        <span
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progresso}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Quanto do mês já foi recebido"
        >
          <span className="block h-full rounded-full bg-livre" style={{ width: `${progresso}%` }} />
        </span>
      </Link>
      <Link href="/financeiro" className="flex flex-col rounded-2xl border bg-card p-4 hover:bg-muted/40">
        <span className="text-sm font-medium text-muted-foreground">Em atraso</span>
        <span className={cn("font-heading text-2xl tabular-nums", n.mes.emAtraso > 0 && "text-destructive")}>{formatarMoeda(n.mes.emAtraso)}</span>
        <span className="text-sm text-muted-foreground">todos os meses</span>
      </Link>
      <Link href="/lembretes?ver=calendario" className="flex flex-col rounded-2xl border bg-card p-4 hover:bg-muted/40">
        <span className="text-sm font-medium text-muted-foreground">A receber em 7 dias</span>
        <span className="font-heading text-2xl tabular-nums">{formatarMoeda(n.aReceberNaSemana)}</span>
        <span className="text-sm text-muted-foreground">aluguéis vencendo</span>
      </Link>
    </div>
  );
}

/** Receitas × despesas de 12 meses e os contratos que terminam em 30, 60 e 90 dias. */
export function EvolucaoDoAno({ n }: { n: NumerosDoPainel }) {
  const totais = n.serie.reduce((t, m) => ({ receitas: t.receitas + m.receitas, despesas: t.despesas + m.despesas }), { receitas: 0, despesas: 0 });
  return (
    <section aria-labelledby="titulo-evolucao" className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="rounded-3xl border bg-card p-3 sm:p-6">
        <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="titulo-evolucao" className="font-heading text-xl">
              Receitas e despesas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
              Últimos 12 meses: entrou {formatarMoeda(totais.receitas)}, saiu {formatarMoeda(totais.despesas)}
            </p>
          </div>
          <Button asChild variant="ghost" className="self-start sm:self-auto">
            <Link href="/financeiro/relatorios">
              <FileBarChart className="size-4" />
              Relatórios
            </Link>
          </Button>
        </header>
        <GraficoDozeMeses meses={n.serie} />
      </div>

      <div className="flex flex-col rounded-3xl border bg-card p-3 sm:p-6">
        <h2 className="font-heading text-xl">Contratos terminando</h2>
        <ul className="mt-4 grid grid-cols-3 gap-2 text-center">
          {n.vencendo.map(({ dias, quantos }) => (
            <li key={dias} className="flex flex-col rounded-xl bg-muted/60 py-3">
              <span className="font-heading text-2xl tabular-nums">{quantos}</span>
              <span className="text-xs text-muted-foreground">em até {dias} dias</span>
            </li>
          ))}
        </ul>
        <Button asChild variant="ghost" className="mt-auto self-start pt-4">
          <Link href="/contratos">
            Ver contratos
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
