"use client";

import { useEffect, useRef, useState } from "react";
import { formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { mesPorExtenso } from "@/modulos/financeiro/regras";

type Mes = { mes: string; receitas: number; despesas: number; saldo: number };

const ALTURA = 220;
const MARGEM = { topo: 10, base: 26, esquerda: 52, direita: 6 };
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Passo "redondo" do eixo (1, 2, 2,5 ou 5 × 10ⁿ reais), com no máximo 4 faixas até o maior valor. */
function passoDoEixo(maiorCentavos: number) {
  const maior = Math.max(maiorCentavos / 100, 1);
  const base = 10 ** Math.floor(Math.log10(maior / 4));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * base).find((p) => maior / p <= 4) ?? base * 10;
  return passo * 100;
}

/** 0 → "R$ 0"; 12.500 → "12,5 mil"; 1.200.000 → "1,2 mi". */
function compacto(centavos: number) {
  const reais = centavos / 100;
  if (reais === 0) return "R$ 0";
  if (reais >= 1_000_000) return `${(reais / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (reais >= 1_000) return `${(reais / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${reais.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
}

/** Coluna com o topo arredondado (4 px) e a base reta, crescendo da linha do zero. */
function coluna(x: number, y: number, largura: number, altura: number) {
  const r = Math.min(4, largura / 2, altura);
  return `M${x},${y + altura}V${y + r}Q${x},${y} ${x + r},${y}H${x + largura - r}Q${x + largura},${y} ${x + largura},${y + r}V${y + altura}Z`;
}

/**
 * Receitas × despesas dos últimos 12 meses (regime de caixa). Colunas finas lado a lado, com 2 px de
 * folga; legenda acima; dica ao passar o dedo/mouse ou com o teclado; e os mesmos números em tabela.
 * Cores: --chart-1 e --chart-2, validadas para os dois temas (globals.css).
 */
export function GraficoDozeMeses({ meses }: { meses: Mes[] }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  const [ativo, setAtivo] = useState<number | null>(null);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const observador = new ResizeObserver(([entrada]) => setLargura(Math.round(entrada.contentRect.width)));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  const maior = Math.max(...meses.flatMap((m) => [m.receitas, m.despesas]), 0);
  const passo = passoDoEixo(maior);
  const topoDoEixo = Math.max(passo, Math.ceil(maior / passo) * passo);
  const marcas = Array.from({ length: Math.round(topoDoEixo / passo) + 1 }, (_, i) => i * passo);

  const areaL = Math.max(0, largura - MARGEM.esquerda - MARGEM.direita);
  const areaA = ALTURA - MARGEM.topo - MARGEM.base;
  const faixa = areaL / meses.length;
  const barra = Math.max(3, Math.min(24, (faixa * 0.72 - 2) / 2));
  const y = (v: number) => MARGEM.topo + areaA - (v / topoDoEixo) * areaA;
  const mesAtivo = ativo === null ? null : meses[ativo];

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Legenda">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-chart-1" aria-hidden="true" />
          Receitas
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-chart-2" aria-hidden="true" />
          Despesas
        </li>
      </ul>

      <div ref={caixa} className="relative" style={{ height: ALTURA }} onPointerLeave={() => setAtivo(null)}>
        {largura > 0 && (
          <svg width={largura} height={ALTURA} role="img" aria-label="Receitas e despesas dos últimos 12 meses (a tabela abaixo tem os valores)">
            {marcas.map((m) => (
              <g key={m}>
                <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(m)} y2={y(m)} className="stroke-border" strokeWidth={1} />
                <text x={MARGEM.esquerda - 6} y={y(m)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                  {compacto(m)}
                </text>
              </g>
            ))}
            {meses.map((m, i) => {
              const centro = MARGEM.esquerda + faixa * i + faixa / 2;
              const xReceita = centro - barra - 1;
              const xDespesa = centro + 1;
              return (
                <g
                  key={m.mes}
                  tabIndex={0}
                  role="button"
                  aria-label={`${mesPorExtenso(`${m.mes}-01`)}: receitas ${formatarMoeda(m.receitas)}, despesas ${formatarMoeda(m.despesas)}, saldo ${formatarMoeda(m.saldo)}`}
                  onPointerEnter={() => setAtivo(i)}
                  onFocus={() => setAtivo(i)}
                  onBlur={() => setAtivo(null)}
                  className="outline-none"
                >
                  {/* A faixa inteira do mês é o alvo: ninguém precisa acertar uma barra fina. */}
                  <rect
                    x={MARGEM.esquerda + faixa * i}
                    y={MARGEM.topo}
                    width={faixa}
                    height={areaA}
                    rx={6}
                    className={cn("fill-transparent", ativo === i && "fill-muted")}
                  />
                  {m.receitas > 0 && <path d={coluna(xReceita, y(m.receitas), barra, y(0) - y(m.receitas))} className="fill-chart-1" />}
                  {m.despesas > 0 && <path d={coluna(xDespesa, y(m.despesas), barra, y(0) - y(m.despesas))} className="fill-chart-2" />}
                  <text x={centro} y={ALTURA - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                    {MESES_CURTOS[Number(m.mes.slice(5, 7)) - 1]}
                  </text>
                </g>
              );
            })}
            <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(0)} y2={y(0)} className="stroke-muted-foreground/40" strokeWidth={1} />
          </svg>
        )}

        {mesAtivo && ativo !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 w-44 rounded-lg border bg-popover p-2.5 text-sm shadow-md"
            style={{
              left: Math.min(Math.max(MARGEM.esquerda + faixa * ativo + faixa / 2 - 88, 0), Math.max(largura - 176, 0)),
            }}
          >
            <p className="mb-1.5 text-xs text-muted-foreground first-letter:uppercase">{mesPorExtenso(`${mesAtivo.mes}-01`)}</p>
            <Linha cor="bg-chart-1" rotulo="Receitas" valor={mesAtivo.receitas} />
            <Linha cor="bg-chart-2" rotulo="Despesas" valor={mesAtivo.despesas} />
            <p className="mt-1 flex justify-between border-t pt-1 text-xs text-muted-foreground">
              Saldo <span className="font-semibold text-foreground tabular-nums">{formatarMoeda(mesAtivo.saldo)}</span>
            </p>
          </div>
        )}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Ver em tabela</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-right tabular-nums">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 text-left font-medium">Mês</th>
                <th className="py-1 font-medium">Receitas</th>
                <th className="py-1 font-medium">Despesas</th>
                <th className="py-1 font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {meses.map((m) => (
                <tr key={m.mes}>
                  <td className="py-1 text-left first-letter:uppercase">{mesPorExtenso(`${m.mes}-01`)}</td>
                  <td className="py-1">{formatarMoeda(m.receitas)}</td>
                  <td className="py-1">{formatarMoeda(m.despesas)}</td>
                  <td className={cn("py-1", m.saldo < 0 && "text-destructive")}>{formatarMoeda(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

/** Linha da dica: o valor em destaque, o nome da série em segundo plano e um traço da cor. */
function Linha({ cor, rotulo, valor }: { cor: string; rotulo: string; valor: number }) {
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("h-0.5 w-3 rounded-full", cor)} aria-hidden="true" />
        {rotulo}
      </span>
      <span className="font-semibold tabular-nums">{formatarMoeda(valor)}</span>
    </p>
  );
}
