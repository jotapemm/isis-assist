import "server-only";
import { hojeISO, isoDeDataCalendario } from "@/lib/formatar";
import { compararIdentificacao } from "@/modulos/apartamentos/status";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";
import { emAberto } from "./regras";

const data = (d: Date | null) => (d ? isoDeDataCalendario(d) : null);

const selecaoResumo = {
  id: true,
  numero: true,
  titulo: true,
  prioridade: true,
  status: true,
  custoEstimado: true,
  custoFinal: true,
  abertaEm: true,
  concluidaEm: true,
  apartamento: { select: { id: true, identificacao: true } },
  prestador: { select: { id: true, nome: true } },
} as const;

type Bruta = {
  abertaEm: Date;
  concluidaEm: Date | null;
};
const resumir = <T extends Bruta>(o: T) => ({ ...o, abertaEm: data(o.abertaEm)!, concluidaEm: data(o.concluidaEm) });

/** Todas as ordens da conta, das mais novas para as mais antigas. */
export async function listarOrdens(ctx: Contexto) {
  const ordens = await db.ordemServico.findMany({
    where: { organizationId: ctx.organizacaoId },
    orderBy: { numero: "desc" },
    take: 300,
    select: selecaoResumo,
  });
  return { hoje: hojeISO(), ordens: ordens.map(resumir) };
}

export type OrdemResumo = Awaited<ReturnType<typeof listarOrdens>>["ordens"][number];

export async function ordensDoApartamento(ctx: Contexto, apartamentoId: string) {
  const ordens = await db.ordemServico.findMany({
    where: { organizationId: ctx.organizacaoId, apartamentoId },
    orderBy: { numero: "desc" },
    take: 20,
    select: selecaoResumo,
  });
  return ordens.map(resumir);
}

export async function obterOrdem(ctx: Contexto, id: string) {
  const os = await db.ordemServico.findFirst({
    where: { id, organizationId: ctx.organizacaoId },
    include: {
      apartamento: { select: { id: true, identificacao: true, status: true } },
      prestador: true,
      despesa: { select: { id: true, valor: true, data: true, removidaEm: true } },
      arquivos: { where: { categoria: "FOTO_OS" }, orderBy: [{ ordem: "asc" }, { createdAt: "asc" }], select: { id: true, nomeOriginal: true } },
    },
  });
  if (!os) return null;
  // Outra OS aberta no mesmo imóvel muda a sugestão de devolver o status (regras.ts).
  const outrasAbertas = os.apartamentoId
    ? await db.ordemServico.count({
        where: { organizationId: ctx.organizacaoId, apartamentoId: os.apartamentoId, id: { not: os.id }, status: { in: ["ABERTA", "EM_ANDAMENTO"] } },
      })
    : 0;
  return {
    ...os,
    abertaEm: data(os.abertaEm)!,
    concluidaEm: data(os.concluidaEm),
    despesa: os.despesa && !os.despesa.removidaEm ? { ...os.despesa, data: data(os.despesa.data)! } : null,
    outrasAbertas,
    hoje: hojeISO(),
  };
}

export type OrdemDetalhe = NonNullable<Awaited<ReturnType<typeof obterOrdem>>>;

/** Prestadores ativos, com quantos serviços fizeram e quanto já receberam (OS concluídas). */
export async function listarPrestadores(ctx: Contexto) {
  const prestadores = await db.prestador.findMany({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
    orderBy: { nome: "asc" },
    include: { ordens: { select: { status: true, custoFinal: true } } },
  });
  return prestadores.map(({ ordens, ...p }) => ({
    ...p,
    servicos: ordens.filter((o) => o.status === "CONCLUIDA").length,
    abertas: ordens.filter((o) => emAberto(o.status)).length,
    totalPago: ordens.reduce((soma, o) => soma + (o.status === "CONCLUIDA" ? (o.custoFinal ?? 0) : 0), 0),
  }));
}

export type PrestadorResumo = Awaited<ReturnType<typeof listarPrestadores>>[number];

/** O que o formulário de nova OS precisa: imóveis (com status, para a pergunta da Manutenção) e prestadores. */
export async function dadosParaNovaOrdem(ctx: Contexto) {
  const [aptos, prestadores] = await Promise.all([
    db.apartamento.findMany({
      where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
      select: { id: true, identificacao: true, status: true },
    }),
    db.prestador.findMany({
      where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, especialidade: true },
    }),
  ]);
  return {
    hoje: hojeISO(),
    aptos: aptos.sort((a, b) => compararIdentificacao(a.identificacao, b.identificacao)),
    prestadores,
  };
}

/** Para o painel: ordens urgentes ou de prioridade alta que ainda não acabaram. */
export async function avisosDeManutencao(ctx: Contexto) {
  const ordens = await db.ordemServico.findMany({
    where: { organizationId: ctx.organizacaoId, status: { in: ["ABERTA", "EM_ANDAMENTO"] }, prioridade: { in: ["URGENTE", "ALTA"] } },
    orderBy: [{ prioridade: "desc" }, { abertaEm: "asc" }],
    take: 5,
    select: { id: true, numero: true, titulo: true, prioridade: true, abertaEm: true, apartamento: { select: { identificacao: true } } },
  });
  return ordens.map((o) => ({ ...o, abertaEm: data(o.abertaEm)! }));
}

/** Para escolher o prestador ao editar uma OS. */
export async function prestadoresAtivos(ctx: Contexto) {
  return db.prestador.findMany({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}
