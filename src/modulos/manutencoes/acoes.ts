"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hojeISO, paraDataCalendario } from "@/lib/formatar";
import { somenteDigitos } from "@/lib/mascaras";
import { falha, falhaDeValidacao, sucesso, type Resultado } from "@/lib/resultado";
import type { Prisma } from "@/generated/prisma/client";
import { exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";
import {
  type DadosPrestador,
  esquemaCancelarOrdem,
  esquemaConcluirOrdem,
  esquemaEditarOrdem,
  esquemaNovaOrdem,
  esquemaPrestador,
} from "./esquemas";
import { emAberto, numeroOS, ofereceManutencao, ofereceVoltarStatus } from "./regras";

const ouNulo = (v: string) => v.trim() || null;

// ─── Prestadores ───

function camposDoPrestador(d: DadosPrestador) {
  return {
    nome: d.nome,
    especialidade: ouNulo(d.especialidade),
    telefone: somenteDigitos(d.telefone) || null,
    email: ouNulo(d.email),
    documento: somenteDigitos(d.documento) || null,
    chavePix: ouNulo(d.chavePix),
    observacoes: ouNulo(d.observacoes),
  };
}

export async function criarPrestador(entrada: unknown): Promise<Resultado<{ id: string; nome: string }>> {
  const ctx = await exigirContexto();
  const dados = esquemaPrestador.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const p = await db.prestador.create({
    data: { organizationId: ctx.organizacaoId, ...camposDoPrestador(dados.data) },
    select: { id: true, nome: true },
  });
  refresh();
  return sucesso(p);
}

export async function editarPrestador(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaPrestador.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const { count } = await db.prestador.updateMany({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    data: camposDoPrestador(dados.data),
  });
  if (count === 0) return falha("Esse prestador não existe mais.");
  refresh();
  return sucesso();
}

/** Some da lista e dos formulários; as ordens antigas continuam mostrando o nome. */
export async function arquivarPrestador(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  await db.prestador.updateMany({ where: { id, organizationId: ctx.organizacaoId }, data: { arquivadoEm: new Date() } });
  refresh();
  return sucesso();
}

// ─── Ordens de serviço ───

async function prestadorDaConta(organizationId: string, prestadorId: string) {
  if (!prestadorId) return null;
  return db.prestador.findFirst({ where: { id: prestadorId, organizationId, arquivadoEm: null }, select: { id: true } });
}

export async function abrirOrdem(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaNovaOrdem.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;
  if (d.abertaEm > hojeISO()) return falha("A data de abertura não pode ser no futuro.", { abertaEm: "Escolha hoje ou uma data passada." });

  const [apto, prestador] = await Promise.all([
    d.apartamentoId
      ? db.apartamento.findFirst({
          where: { id: d.apartamentoId, organizationId: ctx.organizacaoId, arquivadoEm: null },
          select: { id: true, status: true },
        })
      : null,
    prestadorDaConta(ctx.organizacaoId, d.prestadorId),
  ]);
  if (d.apartamentoId && !apto) return falha("Esse imóvel não existe mais.");
  if (d.prestadorId && !prestador) return falha("Esse prestador não existe mais.");
  const mudarStatus = Boolean(apto && d.colocarEmManutencao && ofereceManutencao(apto.status));

  const id = await db.$transaction(async (tx) => {
    // Número sequencial da conta, como o dos recibos.
    const { proximoNumeroOS } = await tx.configuracao.update({
      where: { organizationId: ctx.organizacaoId },
      data: { proximoNumeroOS: { increment: 1 } },
      select: { proximoNumeroOS: true },
    });
    const numero = proximoNumeroOS - 1;
    const os = await tx.ordemServico.create({
      data: {
        organizationId: ctx.organizacaoId,
        numero,
        apartamentoId: apto?.id ?? null,
        prestadorId: prestador?.id ?? null,
        titulo: d.titulo,
        descricao: ouNulo(d.descricao),
        prioridade: d.prioridade,
        custoEstimado: d.custoEstimado || null,
        abertaEm: paraDataCalendario(d.abertaEm),
        statusAnteriorApto: mudarStatus ? apto!.status : null,
      },
      select: { id: true },
    });
    if (mudarStatus) {
      await tx.apartamento.update({ where: { id: apto!.id }, data: { status: "MANUTENCAO" } });
      await tx.historicoStatus.create({
        data: {
          organizationId: ctx.organizacaoId,
          apartamentoId: apto!.id,
          de: apto!.status,
          para: "MANUTENCAO",
          origem: "MANUTENCAO",
          motivo: `${numeroOS(numero)}: ${d.titulo}`,
          usuarioId: ctx.usuario.id,
        },
      });
    }
    return os.id;
  });
  redirect(`/manutencoes/${id}`);
}

async function ordemDaConta(organizationId: string, id: string) {
  return db.ordemServico.findFirst({
    where: { id, organizationId },
    select: {
      id: true,
      numero: true,
      titulo: true,
      status: true,
      abertaEm: true,
      apartamentoId: true,
      statusAnteriorApto: true,
      apartamento: { select: { status: true } },
      prestador: { select: { nome: true } },
    },
  });
}

export async function editarOrdem(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaEditarOrdem.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;
  const os = await ordemDaConta(ctx.organizacaoId, id);
  if (!os) return falha("Essa ordem de serviço não existe mais.");
  const prestador = await prestadorDaConta(ctx.organizacaoId, d.prestadorId);
  if (d.prestadorId && !prestador) return falha("Esse prestador não existe mais.");

  await db.ordemServico.update({
    where: { id: os.id },
    data: {
      titulo: d.titulo,
      descricao: ouNulo(d.descricao),
      prioridade: d.prioridade,
      prestadorId: prestador?.id ?? null,
      custoEstimado: d.custoEstimado || null,
    },
  });
  refresh();
  return sucesso();
}

export async function comecarOrdem(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const { count } = await db.ordemServico.updateMany({
    where: { id, organizationId: ctx.organizacaoId, status: "ABERTA" },
    data: { status: "EM_ANDAMENTO" },
  });
  if (count === 0) return falha("Essa ordem já não está aberta.");
  refresh();
  return sucesso();
}

/** Devolve o imóvel ao status de antes da OS, se ela o tinha posto em Manutenção (regras.ts). */
async function voltarStatusSePreciso(
  tx: Prisma.TransactionClient,
  ctx: { organizacaoId: string; usuario: { id: string } },
  os: NonNullable<Awaited<ReturnType<typeof ordemDaConta>>>,
  motivo: string,
) {
  const outras = os.apartamentoId
    ? await tx.ordemServico.count({
        where: { apartamentoId: os.apartamentoId, id: { not: os.id }, status: { in: ["ABERTA", "EM_ANDAMENTO"] } },
      })
    : 0;
  const volta = ofereceVoltarStatus(os, os.apartamento?.status ?? null, outras);
  if (!volta || !os.apartamentoId) return;
  const para = volta.para as NonNullable<typeof os.statusAnteriorApto>;
  await tx.apartamento.update({ where: { id: os.apartamentoId }, data: { status: para } });
  await tx.historicoStatus.create({
    data: {
      organizationId: ctx.organizacaoId,
      apartamentoId: os.apartamentoId,
      de: "MANUTENCAO",
      para,
      origem: "MANUTENCAO",
      motivo,
      usuarioId: ctx.usuario.id,
    },
  });
}

/** Concluir: com custo, a despesa de manutenção nasce sozinha (aparece no Financeiro do mês). */
export async function concluirOrdem(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaConcluirOrdem.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;
  const os = await ordemDaConta(ctx.organizacaoId, id);
  if (!os) return falha("Essa ordem de serviço não existe mais.");
  if (!emAberto(os.status)) return falha("Essa ordem já foi encerrada.");
  if (d.concluidaEm > hojeISO()) return falha("A data não pode ser no futuro.", { concluidaEm: "Escolha hoje ou uma data passada." });
  if (paraDataCalendario(d.concluidaEm) < os.abertaEm) {
    return falha("A conclusão não pode ser antes da abertura.", { concluidaEm: "Antes da data de abertura." });
  }

  await db.$transaction(async (tx) => {
    await tx.ordemServico.update({
      where: { id: os.id },
      data: { status: "CONCLUIDA", concluidaEm: paraDataCalendario(d.concluidaEm), custoFinal: d.custoFinal || null, solucao: ouNulo(d.solucao) },
    });
    if (d.custoFinal > 0) {
      await tx.despesa.create({
        data: {
          organizationId: ctx.organizacaoId,
          apartamentoId: os.apartamentoId,
          categoria: "MANUTENCAO",
          descricao: `${os.titulo} (${numeroOS(os.numero)})`.slice(0, 120),
          valor: d.custoFinal,
          data: paraDataCalendario(d.concluidaEm),
          observacao: os.prestador ? `Prestador: ${os.prestador.nome}` : null,
          ordemServicoId: os.id,
        },
      });
    }
    if (d.voltarStatus) await voltarStatusSePreciso(tx, ctx, os, `${numeroOS(os.numero)} concluída`);
  });
  refresh();
  return sucesso();
}

export async function cancelarOrdem(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaCancelarOrdem.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const os = await ordemDaConta(ctx.organizacaoId, id);
  if (!os) return falha("Essa ordem de serviço não existe mais.");
  if (!emAberto(os.status)) return falha("Essa ordem já foi encerrada.");

  await db.$transaction(async (tx) => {
    await tx.ordemServico.update({ where: { id: os.id }, data: { status: "CANCELADA", solucao: ouNulo(dados.data.motivo) } });
    if (dados.data.voltarStatus) await voltarStatusSePreciso(tx, ctx, os, `${numeroOS(os.numero)} cancelada`);
  });
  refresh();
  return sucesso();
}

/**
 * Reabrir (encerrou por engano ou o conserto voltou a dar problema): a despesa que a conclusão criou
 * sai do Financeiro — concluir de novo cria outra, com o custo certo. O status do imóvel não muda.
 */
export async function reabrirOrdem(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const os = await ordemDaConta(ctx.organizacaoId, id);
  if (!os) return falha("Essa ordem de serviço não existe mais.");
  if (emAberto(os.status)) return falha("Essa ordem já está aberta.");

  await db.$transaction([
    db.despesa.updateMany({
      where: { organizationId: ctx.organizacaoId, ordemServicoId: os.id },
      data: { removidaEm: new Date(), ordemServicoId: null },
    }),
    db.ordemServico.update({
      where: { id: os.id },
      data: { status: os.status === "CANCELADA" ? "ABERTA" : "EM_ANDAMENTO", concluidaEm: null, solucao: null },
    }),
  ]);
  refresh();
  return sucesso();
}
