"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { paraDataCalendario } from "@/lib/formatar";
import { somenteDigitos } from "@/lib/mascaras";
import { falha, falhaDeValidacao, sucesso, type Resultado } from "@/lib/resultado";
import { type Contexto, exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";
import { type DadosInquilino, esquemaInquilino } from "./esquemas";

const ouNulo = (v: string) => v.trim() || null;
const digitosOuNulo = (v: string) => somenteDigitos(v) || null;

function camposDoInquilino(d: DadosInquilino) {
  return {
    nome: d.nome,
    cpf: digitosOuNulo(d.cpf),
    rg: ouNulo(d.rg),
    dataNascimento: d.dataNascimento ? paraDataCalendario(d.dataNascimento) : null,
    telefone: digitosOuNulo(d.telefone),
    email: ouNulo(d.email),
    profissao: ouNulo(d.profissao),
    rendaMensal: d.rendaMensal || null,
    contatoEmergenciaNome: ouNulo(d.contatoEmergenciaNome),
    contatoEmergenciaTelefone: digitosOuNulo(d.contatoEmergenciaTelefone),
    contatoEmergenciaParentesco: ouNulo(d.contatoEmergenciaParentesco),
    aceitaWhatsapp: d.aceitaWhatsapp,
    observacoes: ouNulo(d.observacoes),
  };
}

function camposDoFiador(d: DadosInquilino) {
  return {
    nome: d.fiador.nome.trim(),
    cpf: digitosOuNulo(d.fiador.cpf),
    telefone: digitosOuNulo(d.fiador.telefone),
    email: ouNulo(d.fiador.email),
    endereco: ouNulo(d.fiador.endereco),
  };
}

/** CPF repetido na mesma conta: diz de quem é, para a pessoa achar o cadastro certo. */
async function cpfJaUsado(ctx: Contexto, cpf: string, ignorarId?: string) {
  const digitos = somenteDigitos(cpf);
  if (!digitos) return null;
  const outro = await db.inquilino.findFirst({
    where: { organizationId: ctx.organizacaoId, cpf: digitos, id: { not: ignorarId } },
    select: { nome: true, arquivadoEm: true },
  });
  if (!outro) return null;
  return outro.arquivadoEm
    ? `Esse CPF é de ${outro.nome}, que está arquivado.`
    : `Esse CPF já está no cadastro de ${outro.nome}.`;
}

export async function criarInquilino(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaInquilino.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const conflito = await cpfJaUsado(ctx, dados.data.cpf);
  if (conflito) return falha(conflito, { cpf: conflito });

  const inquilino = await db.inquilino.create({
    data: {
      ...camposDoInquilino(dados.data),
      organizationId: ctx.organizacaoId,
      fiadores: dados.data.temFiador
        ? { create: { ...camposDoFiador(dados.data), organizationId: ctx.organizacaoId } }
        : undefined,
    },
    select: { id: true },
  });
  redirect(`/inquilinos/${inquilino.id}`);
}

export async function editarInquilino(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaInquilino.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const atual = await db.inquilino.findFirst({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    select: { id: true, fiadores: { select: { id: true }, take: 1 } },
  });
  if (!atual) return falha("Esse inquilino não existe mais.");

  const conflito = await cpfJaUsado(ctx, dados.data.cpf, atual.id);
  if (conflito) return falha(conflito, { cpf: conflito });

  const fiadorAtual = atual.fiadores[0];
  await db.$transaction(async (tx) => {
    await tx.inquilino.update({ where: { id: atual.id }, data: camposDoInquilino(dados.data) });
    // Desmarcou "tem fiador": o fiador sai. Marcou: atualiza o que existe ou cria.
    if (!dados.data.temFiador) await tx.fiador.deleteMany({ where: { inquilinoId: atual.id } });
    else if (fiadorAtual) await tx.fiador.update({ where: { id: fiadorAtual.id }, data: camposDoFiador(dados.data) });
    else {
      await tx.fiador.create({
        data: { ...camposDoFiador(dados.data), inquilinoId: atual.id, organizationId: ctx.organizacaoId },
      });
    }
  });
  redirect(`/inquilinos/${atual.id}`);
}

export async function arquivarInquilino(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const ativo = await db.contrato.findFirst({ where: { organizationId: ctx.organizacaoId, inquilinoId: id, status: "ATIVO" } });
  if (ativo) return falha("Este inquilino tem contrato ativo. Encerre o contrato antes de arquivar.");
  const { count } = await db.inquilino.updateMany({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    data: { arquivadoEm: new Date() },
  });
  if (count === 0) return falha("Esse inquilino não existe mais.");
  return sucesso();
}

export async function desarquivarInquilino(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  await db.inquilino.updateMany({ where: { id, organizationId: ctx.organizacaoId }, data: { arquivadoEm: null } });
  refresh();
  return sucesso();
}
