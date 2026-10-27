import "server-only";
import { somarDias, somarMeses } from "@/lib/datas";
import { hojeISO, isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import { compararIdentificacao } from "@/modulos/apartamentos/status";
import { listarContratos } from "@/modulos/contratos/consultas";
import { financeiroDoMes } from "@/modulos/financeiro/consultas";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";
import {
  type DespesaRel,
  despesasPorCategoria,
  dozeMesesAte,
  informeIR,
  mesesDoAno,
  type PagamentoRel,
  resultadoPorImovel,
  resumoDoPeriodo,
  serieMensal,
} from "./regras";

/** Pagamentos (não estornados) com data em [inicio, fim) — regime de caixa. */
async function pagamentosEntre(ctx: Contexto, inicio: string, fim: string): Promise<PagamentoRel[]> {
  const pagamentos = await db.pagamento.findMany({
    where: { organizationId: ctx.organizacaoId, estornadoEm: null, data: { gte: paraDataCalendario(inicio), lt: paraDataCalendario(fim) } },
    orderBy: [{ data: "asc" }, { numeroRecibo: "asc" }],
    select: {
      data: true,
      valorPago: true,
      valorPrincipal: true,
      multa: true,
      juros: true,
      forma: true,
      numeroRecibo: true,
      cobranca: {
        select: {
          competencia: true,
          contrato: { select: { apartamento: { select: { identificacao: true } }, inquilino: { select: { nome: true, cpf: true } } } },
        },
      },
    },
  });
  return pagamentos.map(({ cobranca, ...p }) => ({
    ...p,
    data: isoDeDataCalendario(p.data),
    competencia: isoDeDataCalendario(cobranca.competencia),
    imovel: cobranca.contrato.apartamento.identificacao,
    inquilino: cobranca.contrato.inquilino,
  }));
}

async function despesasEntre(ctx: Contexto, inicio: string, fim: string): Promise<DespesaRel[]> {
  const despesas = await db.despesa.findMany({
    where: { organizationId: ctx.organizacaoId, removidaEm: null, data: { gte: paraDataCalendario(inicio), lt: paraDataCalendario(fim) } },
    orderBy: { data: "asc" },
    select: { data: true, categoria: true, descricao: true, valor: true, apartamento: { select: { identificacao: true } } },
  });
  return despesas.map(({ apartamento, ...d }) => ({ ...d, data: isoDeDataCalendario(d.data), imovel: apartamento?.identificacao ?? null }));
}

/** Quem emite: sai no cabeçalho dos PDFs e da planilha. */
export async function cabecalhoDosRelatorios(ctx: Contexto) {
  const [config, propriedade] = await Promise.all([
    db.configuracao.findUnique({ where: { organizationId: ctx.organizacaoId }, select: { locadorNome: true, locadorDocumento: true } }),
    db.propriedade.findFirst({
      where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
      orderBy: { createdAt: "asc" },
      select: { nome: true, cidade: true, uf: true, tipo: true },
    }),
  ]);
  return {
    residencial: propriedade?.nome ?? "Residencial",
    tipo: propriedade?.tipo ?? "EDIFICIO",
    cidade: propriedade?.cidade ? `${propriedade.cidade}${propriedade.uf ? `/${propriedade.uf}` : ""}` : null,
    locador: { nome: config?.locadorNome ?? null, documento: config?.locadorDocumento ?? null },
    emitidoEm: hojeISO(),
  };
}

export type Cabecalho = Awaited<ReturnType<typeof cabecalhoDosRelatorios>>;

/** Relatório do mês: o que entrou (caixa), o que saiu e a situação dos aluguéis daquele mês. */
export async function relatorioDoMes(ctx: Contexto, competencia: string) {
  const fim = somarMeses(competencia, 1);
  const [cabecalho, pagamentos, despesas, financeiro] = await Promise.all([
    cabecalhoDosRelatorios(ctx),
    pagamentosEntre(ctx, competencia, fim),
    despesasEntre(ctx, competencia, fim),
    financeiroDoMes(ctx, competencia),
  ]);
  return {
    cabecalho,
    competencia,
    pagamentos,
    despesas,
    resumo: resumoDoPeriodo(pagamentos, despesas),
    porCategoria: despesasPorCategoria(despesas),
    alugueis: { previsto: financeiro.totais.previsto, recebido: financeiro.totais.recebidoDoMes, emAtraso: financeiro.totais.emAtraso },
  };
}

export type RelatorioDoMes = Awaited<ReturnType<typeof relatorioDoMes>>;

/** Relatório do ano: mês a mês, por imóvel e por categoria de despesa. */
export async function relatorioDoAno(ctx: Contexto, ano: number) {
  const [cabecalho, pagamentos, despesas] = await Promise.all([
    cabecalhoDosRelatorios(ctx),
    pagamentosEntre(ctx, `${ano}-01-01`, `${ano + 1}-01-01`),
    despesasEntre(ctx, `${ano}-01-01`, `${ano + 1}-01-01`),
  ]);
  return {
    cabecalho,
    ano,
    meses: serieMensal(pagamentos, despesas, mesesDoAno(ano)),
    resumo: resumoDoPeriodo(pagamentos, despesas),
    porImovel: resultadoPorImovel(pagamentos, despesas, compararIdentificacao),
    porCategoria: despesasPorCategoria(despesas),
  };
}

export type RelatorioDoAno = Awaited<ReturnType<typeof relatorioDoAno>>;

/** Informe de IR do ano-calendário, para o contador (regras.ts: informeIR). */
export async function informeDeIR(ctx: Contexto, ano: number) {
  const [cabecalho, pagamentos, despesas] = await Promise.all([
    cabecalhoDosRelatorios(ctx),
    pagamentosEntre(ctx, `${ano}-01-01`, `${ano + 1}-01-01`),
    despesasEntre(ctx, `${ano}-01-01`, `${ano + 1}-01-01`),
  ]);
  return { cabecalho, ...informeIR(pagamentos, despesas, ano) };
}

export type InformeDeIR = Awaited<ReturnType<typeof informeDeIR>>;

/** Painel: receitas × despesas dos últimos 12 meses, previsto × recebido no mês e o que vem por aí. */
export async function numerosDoPainel(ctx: Contexto) {
  const hoje = hojeISO();
  const meses = dozeMesesAte(hoje);
  const inicio = `${meses[0]}-01`;
  const fim = somarMeses(`${meses[11]}-01`, 1);
  const competencia = `${hoje.slice(0, 7)}-01`;
  const [pagamentos, despesas, financeiro, contratos, aReceber] = await Promise.all([
    pagamentosEntre(ctx, inicio, fim),
    despesasEntre(ctx, inicio, fim),
    financeiroDoMes(ctx, competencia),
    listarContratos(ctx),
    db.cobranca.findMany({
      where: {
        organizationId: ctx.organizacaoId,
        status: { in: ["PENDENTE", "PARCIAL"] },
        vencimento: { gte: paraDataCalendario(hoje), lte: paraDataCalendario(somarDias(hoje, 7)) },
      },
      select: { valor: true, pagamentos: { where: { estornadoEm: null }, select: { valorPrincipal: true } } },
    }),
  ]);
  const ativos = contratos.filter((c) => c.status === "ATIVO" && c.diasParaFim !== null && c.diasParaFim >= 0);
  return {
    hoje,
    serie: serieMensal(pagamentos, despesas, meses),
    mes: { previsto: financeiro.totais.previsto, recebido: financeiro.totais.recebidoDoMes, emAtraso: financeiro.totais.emAtraso },
    aReceberNaSemana: aReceber.reduce((soma, c) => soma + c.valor - c.pagamentos.reduce((s, p) => s + p.valorPrincipal, 0), 0),
    vencendo: [30, 60, 90].map((dias) => ({ dias, quantos: ativos.filter((c) => c.diasParaFim! <= dias).length })),
  };
}

export type NumerosDoPainel = Awaited<ReturnType<typeof numerosDoPainel>>;
