"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { somenteDigitos } from "@/lib/mascaras";
import { falha, falhaDeValidacao, sucesso, type Resultado } from "@/lib/resultado";
import { auth } from "@/server/auth";
import { exigirContexto, exigirSessao } from "@/server/contexto";
import { db } from "@/server/db";
import {
  esquemaCobranca,
  esquemaEndereco,
  esquemaLocador,
  esquemaResidencial,
  numeroDeTexto,
} from "./esquemas";

function slugUnico(nome: string) {
  const base = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "conta"}-${randomUUID().slice(0, 6)}`;
}

/**
 * Primeiro acesso: cria a conta do proprietário (organização), o vínculo de dono, as
 * configurações padrão e o residencial — tudo numa transação.
 */
export async function criarResidencial(entrada: unknown): Promise<Resultado> {
  const { user } = await exigirSessao();
  const dados = esquemaResidencial.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const jaTemConta = await db.member.findFirst({ where: { userId: user.id } });
  if (jaTemConta) redirect("/");

  const organizationId = randomUUID();
  const agora = new Date();
  await db.$transaction([
    db.organization.create({
      data: { id: organizationId, name: dados.data.nome, slug: slugUnico(dados.data.nome), createdAt: agora },
    }),
    db.member.create({
      data: { id: randomUUID(), organizationId, userId: user.id, role: "owner", createdAt: agora },
    }),
    db.configuracao.create({
      data: { organizationId, locadorNome: user.name, locadorEmail: user.email },
    }),
    db.propriedade.create({ data: { organizationId, nome: dados.data.nome, tipo: dados.data.tipo } }),
  ]);

  await auth.api.setActiveOrganization({ headers: await headers(), body: { organizationId } });
  redirect("/");
}

export async function salvarLocador(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaLocador.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const d = dados.data;
  await db.configuracao.update({
    where: { organizationId: ctx.organizacaoId },
    data: {
      locadorNome: d.locadorNome,
      locadorDocumento: somenteDigitos(d.locadorDocumento) || null,
      locadorTelefone: somenteDigitos(d.locadorTelefone) || null,
      locadorEmail: d.locadorEmail || null,
      chavePix: d.chavePix || null,
    },
  });
  refresh();
  return sucesso();
}

export async function salvarCobranca(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaCobranca.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  await db.configuracao.update({
    where: { organizationId: ctx.organizacaoId },
    data: {
      multaPercentual: numeroDeTexto(dados.data.multaPercentual),
      jurosMensalPercentual: numeroDeTexto(dados.data.jurosMensalPercentual),
      diasCarencia: Number(dados.data.diasCarencia),
    },
  });
  refresh();
  return sucesso();
}

export async function salvarEndereco(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaEndereco.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const propriedade = await db.propriedade.findFirst({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!propriedade) return falha("Não encontrei o residencial desta conta.");

  const d = dados.data;
  await db.propriedade.update({
    where: { id: propriedade.id, organizationId: ctx.organizacaoId },
    data: {
      nome: d.nome,
      tipo: d.tipo,
      cep: somenteDigitos(d.cep) || null,
      logradouro: d.logradouro || null,
      numero: d.numero || null,
      complemento: d.complemento || null,
      bairro: d.bairro || null,
      cidade: d.cidade || null,
      uf: d.uf || null,
    },
  });
  refresh();
  return sucesso();
}
