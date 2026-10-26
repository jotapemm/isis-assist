import "server-only";
import { somarDias, somarMeses } from "@/lib/datas";
import { hojeISO, isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import { vencimentoNoMes } from "@/modulos/financeiro/regras";
import { garantirCobrancas } from "@/modulos/financeiro/servico";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";

const selecao = {
  id: true,
  titulo: true,
  descricao: true,
  data: true,
  hora: true,
  importante: true,
  recorrencia: true,
  diaRecorrencia: true,
  concluidoEm: true,
  apartamento: { select: { id: true, identificacao: true } },
} as const;

type Bruto = { data: Date | null; concluidoEm: Date | null };
const resumir = <T extends Bruto>(l: T) => ({
  ...l,
  data: l.data ? isoDeDataCalendario(l.data) : null,
  concluidoEm: l.concluidoEm?.toISOString() ?? null,
});

async function buscar(ctx: Contexto, filtro: { apartamentoId?: string }) {
  const where = { organizationId: ctx.organizacaoId, ...filtro };
  const [abertos, concluidos] = await Promise.all([
    db.lembrete.findMany({ where: { ...where, concluidoEm: null }, orderBy: [{ data: "asc" }, { hora: "asc" }, { createdAt: "asc" }], select: selecao }),
    db.lembrete.findMany({ where: { ...where, concluidoEm: { not: null } }, orderBy: { concluidoEm: "desc" }, take: 20, select: selecao }),
  ]);
  return [...abertos, ...concluidos].map(resumir);
}

/** Os abertos (todos) e os 20 últimos concluídos. */
export const listarLembretes = (ctx: Contexto) => buscar(ctx, {});
export const lembretesDoApartamento = (ctx: Contexto, apartamentoId: string) => buscar(ctx, { apartamentoId });

export type LembreteLinha = Awaited<ReturnType<typeof listarLembretes>>[number];

/** Para o painel: o que é para hoje ou já passou da data. */
export async function lembretesParaPainel(ctx: Contexto) {
  const lembretes = await db.lembrete.findMany({
    where: { organizationId: ctx.organizacaoId, concluidoEm: null, data: { lte: paraDataCalendario(hojeISO()) } },
    orderBy: [{ data: "asc" }, { hora: "asc" }],
    take: 5,
    select: selecao,
  });
  return lembretes.map(resumir);
}

export type EventoDoSistema = {
  chave: string;
  tipo: "REAJUSTE" | "FIM_CONTRATO" | "ALUGUEL";
  data: string;
  identificacao: string;
  inquilino: string;
  href: string;
  /** Só no aluguel: já foi pago. */
  pago?: boolean;
  /** Aluguel de mês que ainda não começou: a cobrança nem existe, o vencimento é previsto pelo contrato. */
  previsto?: boolean;
};

/**
 * Lembretes que o sistema calcula sozinho (docs/PLANO.md, regra 7): reajuste, fim de contrato e, no
 * calendário, os vencimentos de aluguel. Sem `inicio`, o reajuste atrasado (data já passou) também vem.
 */
export async function eventosDoSistema(ctx: Contexto, { inicio, fim, comAluguel }: { inicio?: string; fim: string; comAluguel: boolean }) {
  const conta = { organizationId: ctx.organizacaoId };
  const entre = { ...(inicio ? { gte: paraDataCalendario(inicio) } : {}), lte: paraDataCalendario(fim) };
  const pessoas = { apartamento: { select: { identificacao: true } }, inquilino: { select: { nome: true } } } as const;

  if (comAluguel && inicio && inicio.slice(0, 7) === hojeISO().slice(0, 7)) await garantirCobrancas(ctx.organizacaoId, hojeISO());
  const mesFuturo = comAluguel && inicio && inicio.slice(0, 7) > hojeISO().slice(0, 7);
  const [reajustes, fins, alugueis, contratosAtivos] = await Promise.all([
    db.contrato.findMany({ where: { ...conta, status: "ATIVO", proximoReajusteEm: entre }, select: { id: true, proximoReajusteEm: true, ...pessoas } }),
    db.contrato.findMany({ where: { ...conta, status: "ATIVO", dataFim: entre }, select: { id: true, dataFim: true, ...pessoas } }),
    comAluguel
      ? db.cobranca.findMany({
          where: { ...conta, vencimento: entre, status: { not: "CANCELADO" } },
          select: { id: true, vencimento: true, competencia: true, status: true, contrato: { select: pessoas } },
        })
      : [],
    mesFuturo
      ? db.contrato.findMany({
          where: { ...conta, status: "ATIVO" },
          select: { id: true, diaVencimento: true, dataInicio: true, dataFim: true, ...pessoas },
        })
      : [],
  ]);
  // Mês que ainda não começou: o vencimento de cada contrato ativo, como vai ser cobrado.
  const previstos = contratosAtivos.flatMap((c) => {
    const vencimento = vencimentoNoMes(inicio!, c.diaVencimento);
    if (vencimento < isoDeDataCalendario(c.dataInicio) || vencimento > isoDeDataCalendario(c.dataFim)) return [];
    return [
      {
        chave: `p-${c.id}`,
        tipo: "ALUGUEL" as const,
        data: vencimento,
        identificacao: c.apartamento.identificacao,
        inquilino: c.inquilino.nome,
        href: `/contratos/${c.id}`,
        previsto: true,
      },
    ];
  });

  const eventos: EventoDoSistema[] = [
    ...reajustes.map((c) => ({
      chave: `r-${c.id}`,
      tipo: "REAJUSTE" as const,
      data: isoDeDataCalendario(c.proximoReajusteEm!),
      identificacao: c.apartamento.identificacao,
      inquilino: c.inquilino.nome,
      href: `/contratos/${c.id}`,
    })),
    ...fins.map((c) => ({
      chave: `f-${c.id}`,
      tipo: "FIM_CONTRATO" as const,
      data: isoDeDataCalendario(c.dataFim),
      identificacao: c.apartamento.identificacao,
      inquilino: c.inquilino.nome,
      href: `/contratos/${c.id}`,
    })),
    ...alugueis.map((cob) => ({
      chave: `a-${cob.id}`,
      tipo: "ALUGUEL" as const,
      data: isoDeDataCalendario(cob.vencimento),
      identificacao: cob.contrato.apartamento.identificacao,
      inquilino: cob.contrato.inquilino.nome,
      href: `/financeiro?mes=${isoDeDataCalendario(cob.competencia).slice(0, 7)}&pagar=${cob.id}`,
      pago: cob.status === "PAGO",
    })),
    ...previstos,
  ];
  return eventos.sort((a, b) => a.data.localeCompare(b.data) || a.identificacao.localeCompare(b.identificacao));
}

/** Os do sistema para a lista: reajustes (inclusive atrasados) e fins de contrato dos próximos 30 dias. */
export const avisosDoSistema = (ctx: Contexto) => eventosDoSistema(ctx, { fim: somarDias(hojeISO(), 30), comAluguel: false });

/** Os do sistema para um mês do calendário, com os vencimentos de aluguel. */
export const eventosDoMes = (ctx: Contexto, competencia: string) =>
  eventosDoSistema(ctx, { inicio: competencia, fim: somarDias(somarMeses(competencia, 1), -1), comAluguel: true });
