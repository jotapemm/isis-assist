// Cálculo do reajuste anual — puro (sem banco), para testar e para o navegador mostrar a prévia.
import { inicioDoMes, mesAbreviado, somarMeses } from "@/lib/datas";

export const INDICES = {
  IGPM: { rotulo: "IGP-M", descricao: "Índice usado na maioria dos contratos de aluguel." },
  IPCA: { rotulo: "IPCA", descricao: "Inflação oficial; costuma variar menos." },
  FIXO: { rotulo: "Percentual fixo", descricao: "Um percentual combinado no contrato." },
  NENHUM: { rotulo: "Sem reajuste", descricao: "O valor não muda ao longo do contrato." },
} as const;

export type IndiceReajuste = keyof typeof INDICES;

/** Código da série no SGS do Banco Central. */
export const SERIE_BCB = { IGPM: 189, IPCA: 433 } as const;

/**
 * Os 12 meses usados no reajuste de uma data-base: os 12 meses completos que terminam no mês
 * anterior ao aniversário. Aniversário em 15/10/2026 → out/2025 a set/2026.
 */
export function periodoDoIndice(dataBase: string) {
  const fim = inicioDoMes(somarMeses(dataBase, -1));
  const inicio = somarMeses(fim, -11);
  return { inicio, fim, texto: `${mesAbreviado(inicio)} a ${mesAbreviado(fim)}` };
}

/** Lista dos 12 meses ("AAAA-MM-01") do período. */
export function mesesDoPeriodo(inicio: string) {
  return Array.from({ length: 12 }, (_, i) => somarMeses(inicio, i));
}

/** Variações mensais (%) → variação acumulada (%), compondo mês a mês. */
export function acumular(variacoes: number[]) {
  const fator = variacoes.reduce((acc, v) => acc * (1 + v / 100), 1);
  return (fator - 1) * 100;
}

/** Valor novo em centavos, arredondado ao centavo. */
export function aplicarPercentual(centavos: number, percentual: number) {
  return Math.round(centavos * (1 + percentual / 100));
}

/** 4,2731% com 2 casas para mostrar: "4,27%". */
export function percentualTexto(percentual: number, casas = 2) {
  return `${percentual.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}
