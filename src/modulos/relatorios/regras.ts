// Contas dos relatórios — puras (sem banco): o painel, os PDFs, o Excel e o informe de IR saem daqui.
// Receita é sempre por regime de caixa: vale a data em que o dinheiro entrou, não o mês do aluguel.
import { somarMeses } from "@/lib/datas";
import type { CategoriaDespesa } from "@/modulos/financeiro/regras";

export type PagamentoRel = {
  data: string;
  valorPago: number;
  valorPrincipal: number;
  multa: number;
  juros: number;
  forma: string;
  numeroRecibo: number;
  /** Mês do aluguel ("2026-09-01"), que pode ser diferente do mês do pagamento. */
  competencia: string;
  imovel: string;
  inquilino: { nome: string; cpf: string | null };
};

export type DespesaRel = {
  data: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: number;
  /** null = despesa geral do residencial. */
  imovel: string | null;
};

/**
 * Despesas que a proprietária pode deduzir do aluguel no carnê-leão, quando é ela quem paga (IPTU e
 * condomínio). Taxa de administração também entra, mas o sistema não tem essa categoria.
 */
export const DEDUTIVEIS: readonly CategoriaDespesa[] = ["IPTU", "CONDOMINIO"];

const soma = (valores: number[]) => valores.reduce((total, v) => total + v, 0);

/** "2026" → ["2026-01", …, "2026-12"]. */
export const mesesDoAno = (ano: number) => Array.from({ length: 12 }, (_, i) => `${ano}-${String(i + 1).padStart(2, "0")}`);

/** Os 12 meses que terminam em `ate` (inclusive): ["2025-11", …, "2026-10"]. */
export const dozeMesesAte = (ate: string) => Array.from({ length: 12 }, (_, i) => somarMeses(`${ate.slice(0, 7)}-01`, i - 11).slice(0, 7));

export function resumoDoPeriodo(pagamentos: PagamentoRel[], despesas: DespesaRel[]) {
  const aluguel = soma(pagamentos.map((p) => p.valorPrincipal));
  const encargos = soma(pagamentos.map((p) => p.multa + p.juros));
  const gastos = soma(despesas.map((d) => d.valor));
  return { receitas: aluguel + encargos, aluguel, encargos, despesas: gastos, saldo: aluguel + encargos - gastos };
}

/** Receitas e despesas de cada mês (para o gráfico de 12 meses e o relatório anual). */
export function serieMensal(pagamentos: PagamentoRel[], despesas: DespesaRel[], meses: string[]) {
  return meses.map((mes) => {
    const receitas = soma(pagamentos.filter((p) => p.data.startsWith(mes)).map((p) => p.valorPago));
    const gastos = soma(despesas.filter((d) => d.data.startsWith(mes)).map((d) => d.valor));
    return { mes, receitas, despesas: gastos, saldo: receitas - gastos };
  });
}

export function despesasPorCategoria(despesas: DespesaRel[]) {
  const porCategoria = new Map<CategoriaDespesa, number>();
  for (const d of despesas) porCategoria.set(d.categoria, (porCategoria.get(d.categoria) ?? 0) + d.valor);
  return [...porCategoria].map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor);
}

/** Resultado de cada imóvel; as despesas gerais (sem imóvel) ficam numa linha à parte. */
export function resultadoPorImovel(pagamentos: PagamentoRel[], despesas: DespesaRel[], compararImovel: (a: string, b: string) => number) {
  const linhas = new Map<string, { receitas: number; despesas: number }>();
  const linha = (imovel: string) => {
    if (!linhas.has(imovel)) linhas.set(imovel, { receitas: 0, despesas: 0 });
    return linhas.get(imovel)!;
  };
  for (const p of pagamentos) linha(p.imovel).receitas += p.valorPago;
  for (const d of despesas) if (d.imovel) linha(d.imovel).despesas += d.valor;
  const imoveis = [...linhas]
    .map(([imovel, v]) => ({ imovel, ...v, resultado: v.receitas - v.despesas }))
    .sort((a, b) => compararImovel(a.imovel, b.imovel));
  const gerais = soma(despesas.filter((d) => !d.imovel).map((d) => d.valor));
  return { imoveis, gerais };
}

/**
 * Informe de IR (carnê-leão): quanto cada inquilino pagou em cada mês do ano — pela data do pagamento —
 * e as despesas dedutíveis de cada mês. Quem não tem CPF cadastrado vem listado: o carnê-leão pede o CPF
 * de quem pagou.
 */
export function informeIR(pagamentos: PagamentoRel[], despesas: DespesaRel[], ano: number) {
  const meses = mesesDoAno(ano);
  const indice = (data: string) => meses.indexOf(data.slice(0, 7));

  const porPessoa = new Map<string, { nome: string; cpf: string | null; meses: number[]; aluguel: number; encargos: number }>();
  for (const p of pagamentos) {
    const i = indice(p.data);
    if (i < 0) continue;
    const chave = p.inquilino.cpf ?? `sem-cpf:${p.inquilino.nome}`;
    if (!porPessoa.has(chave)) porPessoa.set(chave, { nome: p.inquilino.nome, cpf: p.inquilino.cpf, meses: Array(12).fill(0), aluguel: 0, encargos: 0 });
    const pessoa = porPessoa.get(chave)!;
    pessoa.meses[i] += p.valorPago;
    pessoa.aluguel += p.valorPrincipal;
    pessoa.encargos += p.multa + p.juros;
  }
  const inquilinos = [...porPessoa.values()]
    .map((p) => ({ ...p, total: soma(p.meses) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const dedutiveis = despesas.filter((d) => DEDUTIVEIS.includes(d.categoria) && indice(d.data) >= 0);
  const dedutiveisPorMes = meses.map((mes) => soma(dedutiveis.filter((d) => d.data.startsWith(mes)).map((d) => d.valor)));
  const recebidoPorMes = meses.map((_, i) => soma(inquilinos.map((p) => p.meses[i])));

  return {
    ano,
    meses,
    inquilinos,
    recebidoPorMes,
    dedutiveisPorMes,
    dedutiveisPorCategoria: DEDUTIVEIS.map((categoria) => ({
      categoria,
      valor: soma(dedutiveis.filter((d) => d.categoria === categoria).map((d) => d.valor)),
    })),
    /** Os lançamentos de IPTU e condomínio, um a um, para o contador conferir. */
    despesasDedutiveis: dedutiveis,
    totalRecebido: soma(recebidoPorMes),
    totalDedutivel: soma(dedutiveisPorMes),
    semCpf: inquilinos.filter((p) => !p.cpf).map((p) => p.nome),
  };
}

export type InformeIR = ReturnType<typeof informeIR>;
