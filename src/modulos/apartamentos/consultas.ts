import "server-only";
import { cache } from "react";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";
import { compararIdentificacao } from "./status";
import { type TipoResidencial, vocabulario } from "./vocabulario";

/** O residencial "da casa": hoje cada conta tem um; o modelo já aceita vários. */
export const propriedadePrincipal = cache(async (ctx: Contexto) =>
  db.propriedade.findFirst({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, nome: true, tipo: true },
  }),
);

/** Prédio ou casas — decide as palavras e o desenho do mapa. */
export async function tipoDaConta(ctx: Contexto): Promise<TipoResidencial> {
  return (await propriedadePrincipal(ctx))?.tipo ?? "EDIFICIO";
}

export async function vocabularioDaConta(ctx: Contexto) {
  return vocabulario(await tipoDaConta(ctx));
}

export type ApartamentoResumo = Awaited<ReturnType<typeof listarApartamentos>>[number];

/** Todos os aptos ativos, na ordem da fachada (andar e número), com a foto de capa. */
export async function listarApartamentos(ctx: Contexto) {
  const aptos = await db.apartamento.findMany({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
    select: {
      id: true,
      identificacao: true,
      andar: true,
      bloco: true,
      status: true,
      valorReferencia: true,
      quartos: true,
      areaM2: true,
      arquivos: {
        where: { categoria: "FOTO_APTO" },
        orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { id: true },
      },
      contratos: { where: { status: "ATIVO" }, take: 1, select: { inquilino: { select: { nome: true } } } },
    },
  });
  return aptos
    .map(({ arquivos, contratos, ...apto }) => ({
      ...apto,
      capaId: arquivos[0]?.id ?? null,
      inquilino: contratos[0]?.inquilino.nome ?? null,
    }))
    .sort((a, b) => (a.andar ?? -1) - (b.andar ?? -1) || compararIdentificacao(a.identificacao, b.identificacao));
}

export async function obterApartamento(ctx: Contexto, id: string) {
  return db.apartamento.findFirst({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    include: {
      propriedade: { select: { nome: true } },
      arquivos: {
        where: { categoria: "FOTO_APTO" },
        orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
        select: { id: true, nomeOriginal: true },
      },
      contratos: {
        orderBy: { dataInicio: "desc" },
        select: {
          id: true,
          status: true,
          dataInicio: true,
          dataFim: true,
          encerradoEm: true,
          valorAluguel: true,
          diaVencimento: true,
          inquilino: { select: { id: true, nome: true, telefone: true, aceitaWhatsapp: true } },
        },
      },
      historicoStatus: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          de: true,
          para: true,
          motivo: true,
          origem: true,
          createdAt: true,
          usuario: { select: { name: true } },
        },
      },
    },
  });
}

export type ApartamentoDetalhe = NonNullable<Awaited<ReturnType<typeof obterApartamento>>>;
