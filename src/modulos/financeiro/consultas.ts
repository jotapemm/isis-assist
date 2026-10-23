import "server-only";
import { cache } from "react";
import { somarMeses } from "@/lib/datas";
import { hojeISO, isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";
import { compararIdentificacao } from "../apartamentos/status";
import { type RegrasDeAtraso, situacaoDaCobranca } from "./regras";
import { garantirCobrancas } from "./servico";

/** Multa, juros e tolerância da conta (cada contrato pode ter os seus). */
export const regrasDaConta = cache(async (ctx: Contexto): Promise<RegrasDeAtraso> => {
  const config = await db.configuracao.findUnique({
    where: { organizationId: ctx.organizacaoId },
    select: { multaPercentual: true, jurosMensalPercentual: true, diasCarencia: true },
  });
  return {
    multaPercentual: Number(config?.multaPercentual ?? 10),
    jurosMensalPercentual: Number(config?.jurosMensalPercentual ?? 1),
    diasCarencia: config?.diasCarencia ?? 0,
  };
});

const selecaoCobranca = {
  id: true,
  competencia: true,
  vencimento: true,
  valor: true,
  descricao: true,
  status: true,
  contrato: {
    select: {
      id: true,
      multaPercentual: true,
      jurosMensalPercentual: true,
      apartamento: { select: { id: true, identificacao: true } },
      inquilino: { select: { id: true, nome: true, telefone: true } },
    },
  },
  pagamentos: {
    where: { estornadoEm: null },
    orderBy: { data: "asc" as const },
    select: { id: true, data: true, valorPago: true, valorPrincipal: true, multa: true, juros: true, forma: true, numeroRecibo: true },
  },
} as const;

type CobrancaBruta = Awaited<ReturnType<typeof buscarCobrancas>>[number];

function buscarCobrancas(where: object) {
  return db.cobranca.findMany({ where, select: selecaoCobranca });
}

/** Formato das telas: datas em texto, quanto já foi pago, quanto falta, situação e regras de atraso. */
function resumir(c: CobrancaBruta, hoje: string, regras: RegrasDeAtraso) {
  const vencimento = isoDeDataCalendario(c.vencimento);
  const pago = c.pagamentos.reduce((soma, p) => soma + p.valorPrincipal, 0);
  const regrasDoContrato: RegrasDeAtraso = {
    multaPercentual: c.contrato.multaPercentual === null ? regras.multaPercentual : Number(c.contrato.multaPercentual),
    jurosMensalPercentual:
      c.contrato.jurosMensalPercentual === null ? regras.jurosMensalPercentual : Number(c.contrato.jurosMensalPercentual),
    diasCarencia: regras.diasCarencia,
  };
  return {
    id: c.id,
    competencia: isoDeDataCalendario(c.competencia),
    vencimento,
    valor: c.valor,
    descricao: c.descricao,
    status: c.status,
    pago,
    aberto: c.status === "CANCELADO" ? 0 : Math.max(0, c.valor - pago),
    situacao: situacaoDaCobranca({ status: c.status, vencimento }, hoje, regras.diasCarencia),
    regras: regrasDoContrato,
    contratoId: c.contrato.id,
    apartamento: c.contrato.apartamento,
    inquilino: c.contrato.inquilino,
    pagamentos: c.pagamentos.map((p) => ({ ...p, data: isoDeDataCalendario(p.data) })),
  };
}

export type CobrancaLinha = ReturnType<typeof resumir>;

const ordenar = (a: CobrancaLinha, b: CobrancaLinha) =>
  a.vencimento.localeCompare(b.vencimento) || compararIdentificacao(a.apartamento.identificacao, b.apartamento.identificacao);

/**
 * Tudo da tela Financeiro para um mês: cobranças do mês, as de meses anteriores (em aberto ou acertadas no mês), despesas e
 * totais. Antes de ler, garante que as cobranças do mês corrente existem.
 */
export async function financeiroDoMes(ctx: Contexto, competencia: string) {
  const hoje = hojeISO();
  await garantirCobrancas(ctx.organizacaoId, hoje);
  const regras = await regrasDaConta(ctx);
  const inicio = paraDataCalendario(competencia);
  const fim = paraDataCalendario(somarMeses(competencia, 1));

  const [doMes, deMesesAnteriores, despesas, entradas] = await Promise.all([
    buscarCobrancas({ organizationId: ctx.organizacaoId, competencia: inicio }),
    // Meses anteriores: o que segue em aberto e o que foi acertado neste mês (setembro pago em outubro).
    buscarCobrancas({
      organizationId: ctx.organizacaoId,
      competencia: { lt: inicio },
      OR: [
        { status: { in: ["PENDENTE", "PARCIAL"] } },
        { pagamentos: { some: { estornadoEm: null, data: { gte: inicio, lt: fim } } } },
      ],
    }),
    db.despesa.findMany({
      where: { organizationId: ctx.organizacaoId, removidaEm: null, data: { gte: inicio, lt: fim } },
      orderBy: { data: "desc" },
      select: {
        id: true,
        data: true,
        categoria: true,
        descricao: true,
        valor: true,
        observacao: true,
        ordemServicoId: true,
        apartamento: { select: { id: true, identificacao: true } },
        arquivos: { select: { id: true, nomeOriginal: true, tipoMime: true, tamanhoBytes: true, createdAt: true } },
      },
    }),
    // Caixa: tudo que entrou com data neste mês, inclusive atrasados de meses anteriores.
    db.pagamento.aggregate({
      where: { organizationId: ctx.organizacaoId, estornadoEm: null, data: { gte: inicio, lt: fim } },
      _sum: { valorPago: true },
    }),
  ]);

  const cobrancas = doMes.map((c) => resumir(c, hoje, regras)).sort(ordenar);
  const anteriores = deMesesAnteriores.map((c) => resumir(c, hoje, regras)).sort(ordenar);
  const ativas = cobrancas.filter((c) => c.status !== "CANCELADO");
  const despesasDoMes = despesas.map((d) => ({ ...d, data: isoDeDataCalendario(d.data) }));

  return {
    hoje,
    regras,
    cobrancas,
    anteriores,
    despesas: despesasDoMes,
    totais: {
      previsto: ativas.reduce((s, c) => s + c.valor, 0),
      recebidoDoMes: ativas.reduce((s, c) => s + c.pago, 0),
      emAtraso: [...cobrancas, ...anteriores].filter((c) => c.situacao === "ATRASADA").reduce((s, c) => s + c.aberto, 0),
      entradas: entradas._sum.valorPago ?? 0,
      despesas: despesasDoMes.reduce((s, d) => s + d.valor, 0),
    },
  };
}

export type FinanceiroDoMes = Awaited<ReturnType<typeof financeiroDoMes>>;

/** Últimas cobranças de um contrato (página do contrato). */
export async function cobrancasDoContrato(ctx: Contexto, contratoId: string) {
  const hoje = hojeISO();
  await garantirCobrancas(ctx.organizacaoId, hoje);
  const [regras, brutas] = await Promise.all([
    regrasDaConta(ctx),
    db.cobranca.findMany({
      where: { organizationId: ctx.organizacaoId, contratoId },
      orderBy: { competencia: "desc" },
      take: 12,
      select: selecaoCobranca,
    }),
  ]);
  return { hoje, regras, cobrancas: brutas.map((c) => resumir(c, hoje, regras)) };
}

/** Para o painel: quantos aluguéis estão atrasados e quanto falta receber deles. */
export async function atrasosParaPainel(ctx: Contexto) {
  const hoje = hojeISO();
  await garantirCobrancas(ctx.organizacaoId, hoje);
  const regras = await regrasDaConta(ctx);
  const abertas = await buscarCobrancas({
    organizationId: ctx.organizacaoId,
    status: { in: ["PENDENTE", "PARCIAL"] },
    vencimento: { lt: paraDataCalendario(hoje) },
  });
  const atrasadas = abertas.map((c) => resumir(c, hoje, regras)).filter((c) => c.situacao === "ATRASADA");
  return { quantidade: atrasadas.length, total: atrasadas.reduce((s, c) => s + c.aberto, 0) };
}
