"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { falha, falhaDeValidacao, sucesso, type Resultado } from "@/lib/resultado";
import { exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";
import { bloqueioPorContrato } from "../contratos/consultas";
import { propriedadePrincipal } from "./consultas";
import { esquemaApartamento, esquemaLote, esquemaMudarStatus, textoParaInteiro } from "./esquemas";
import { gerarIdentificacoes, numerarCasas } from "./lote";
import { STATUS } from "./status";

function dadosDoFormulario(d: ReturnType<typeof esquemaApartamento.parse>) {
  return {
    identificacao: d.identificacao,
    andar: textoParaInteiro(d.andar),
    bloco: d.bloco || null,
    valorReferencia: d.valorReferencia || null,
    quartos: textoParaInteiro(d.quartos),
    areaM2: textoParaInteiro(d.areaM2),
    descricao: d.descricao || null,
    observacoes: d.observacoes || null,
  };
}

/** Mesmo número no mesmo residencial não pode — inclusive com um apto arquivado. */
async function conflitoDeIdentificacao(propriedadeId: string, identificacao: string, ignorarId?: string) {
  const existente = await db.apartamento.findFirst({
    where: { propriedadeId, identificacao: { equals: identificacao, mode: "insensitive" }, id: { not: ignorarId } },
    select: { arquivadoEm: true },
  });
  if (!existente) return null;
  return existente.arquivadoEm
    ? `O número ${identificacao} já é de um imóvel arquivado. Use outro número.`
    : `O número ${identificacao} já está em uso neste residencial.`;
}

export async function criarApartamento(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaApartamento.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const propriedade = await propriedadePrincipal(ctx);
  if (!propriedade) return falha("Não encontrei o residencial desta conta.");
  const conflito = await conflitoDeIdentificacao(propriedade.id, dados.data.identificacao);
  if (conflito) return falha(conflito, { identificacao: conflito });

  const apto = await db.apartamento.create({
    data: {
      ...dadosDoFormulario(dados.data),
      organizationId: ctx.organizacaoId,
      propriedadeId: propriedade.id,
      historicoStatus: {
        create: { organizationId: ctx.organizacaoId, para: "LIVRE", usuarioId: ctx.usuario.id },
      },
    },
    select: { id: true },
  });
  redirect(`/apartamentos/${apto.id}`);
}

export async function editarApartamento(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaApartamento.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const apto = await db.apartamento.findFirst({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    select: { id: true, propriedadeId: true },
  });
  if (!apto) return falha("Esse imóvel não existe mais.");
  const conflito = await conflitoDeIdentificacao(apto.propriedadeId, dados.data.identificacao, apto.id);
  if (conflito) return falha(conflito, { identificacao: conflito });

  await db.apartamento.update({ where: { id: apto.id }, data: dadosDoFormulario(dados.data) });
  redirect(`/apartamentos/${apto.id}`);
}

/** Cria vários aptos de uma vez; números que já existem são pulados (dá para rodar de novo sem duplicar). */
export async function gerarApartamentos(entrada: unknown): Promise<Resultado<{ criados: number; pulados: number }>> {
  const ctx = await exigirContexto();
  const dados = esquemaLote.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const propriedade = await propriedadePrincipal(ctx);
  if (!propriedade) return falha("Não encontrei o residencial desta conta.");

  const planejados = dados.data.modo === "CASAS" ? numerarCasas(dados.data.quantidade) : gerarIdentificacoes(dados.data);
  const existentes = new Set(
    (
      await db.apartamento.findMany({ where: { propriedadeId: propriedade.id }, select: { identificacao: true } })
    ).map((a) => a.identificacao.toLowerCase()),
  );
  const novos = planejados.filter((a) => !existentes.has(a.identificacao.toLowerCase()));

  await db.$transaction(async (tx) => {
    const criados = await tx.apartamento.createManyAndReturn({
      data: novos.map((a) => ({
        organizationId: ctx.organizacaoId,
        propriedadeId: propriedade.id,
        identificacao: a.identificacao,
        andar: a.andar,
        valorReferencia: dados.data.valorReferencia || null,
      })),
      select: { id: true },
    });
    await tx.historicoStatus.createMany({
      data: criados.map((a) => ({
        organizationId: ctx.organizacaoId,
        apartamentoId: a.id,
        para: "LIVRE" as const,
        usuarioId: ctx.usuario.id,
      })),
    });
  });

  refresh();
  return sucesso({ criados: novos.length, pulados: planejados.length - novos.length });
}

export async function mudarStatus(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaMudarStatus.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const apto = await db.apartamento.findFirst({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    select: { id: true, status: true },
  });
  if (!apto) return falha("Esse imóvel não existe mais.");
  if (apto.status === dados.data.status) return falha(`Ele já está como ${STATUS[apto.status].rotulo}.`);
  const bloqueio = await bloqueioPorContrato(ctx.organizacaoId, apto.id, dados.data.status);
  if (bloqueio) return falha(bloqueio);

  await db.$transaction([
    db.apartamento.update({ where: { id: apto.id }, data: { status: dados.data.status } }),
    db.historicoStatus.create({
      data: {
        organizationId: ctx.organizacaoId,
        apartamentoId: apto.id,
        de: apto.status,
        para: dados.data.status,
        motivo: dados.data.motivo || null,
        usuarioId: ctx.usuario.id,
      },
    }),
  ]);
  refresh();
  return sucesso();
}

export async function arquivarApartamento(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const ativo = await db.contrato.findFirst({ where: { organizationId: ctx.organizacaoId, apartamentoId: id, status: "ATIVO" } });
  if (ativo) return falha("Este imóvel tem contrato ativo. Encerre o contrato antes de arquivar.");
  const { count } = await db.apartamento.updateMany({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    data: { arquivadoEm: new Date() },
  });
  if (count === 0) return falha("Esse imóvel não existe mais.");
  return sucesso();
}

export async function desarquivarApartamento(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  await db.apartamento.updateMany({ where: { id, organizationId: ctx.organizacaoId }, data: { arquivadoEm: null } });
  refresh();
  return sucesso();
}
