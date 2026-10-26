"use server";

import { refresh } from "next/cache";
import { isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import { falha, falhaDeValidacao, sucesso, type Resultado } from "@/lib/resultado";
import { type Contexto, exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";
import { type DadosLembrete, esquemaLembrete } from "./esquemas";
import { proximaData } from "./regras";

async function camposDoLembrete(ctx: Contexto, d: DadosLembrete) {
  const apto = d.apartamentoId
    ? await db.apartamento.findFirst({ where: { id: d.apartamentoId, organizationId: ctx.organizacaoId }, select: { id: true } })
    : null;
  if (d.apartamentoId && !apto) return null;
  const repeteNoMes = d.recorrencia === "MENSAL" || d.recorrencia === "ANUAL";
  return {
    titulo: d.titulo,
    descricao: d.descricao || null,
    data: d.data ? paraDataCalendario(d.data) : null,
    hora: d.data && d.hora ? d.hora : null,
    apartamentoId: apto?.id ?? null,
    importante: d.importante,
    recorrencia: d.data ? d.recorrencia : "NENHUMA",
    // O dia pedido, para o "todo dia 31" voltar ao 31 depois de fevereiro (regras.ts: proximaData).
    diaRecorrencia: d.data && repeteNoMes ? Number(d.data.slice(8, 10)) : null,
  } as const;
}

export async function criarLembrete(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaLembrete.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const campos = await camposDoLembrete(ctx, dados.data);
  if (!campos) return falha("Esse imóvel não existe mais.");
  await db.lembrete.create({ data: { organizationId: ctx.organizacaoId, ...campos } });
  refresh();
  return sucesso();
}

export async function editarLembrete(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaLembrete.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const campos = await camposDoLembrete(ctx, dados.data);
  if (!campos) return falha("Esse imóvel não existe mais.");
  const { count } = await db.lembrete.updateMany({ where: { id, organizationId: ctx.organizacaoId }, data: campos });
  if (count === 0) return falha("Esse lembrete não existe mais.");
  refresh();
  return sucesso();
}

/**
 * Concluir. Se repete, nasce a próxima ocorrência (uma cópia com a data seguinte); o id dela volta para
 * o "Desfazer" poder apagá-la.
 */
export async function concluirLembrete(id: string): Promise<Resultado<{ proximoId: string | null; proximaData: string | null }>> {
  const ctx = await exigirContexto();
  const l = await db.lembrete.findFirst({ where: { id, organizationId: ctx.organizacaoId, concluidoEm: null } });
  if (!l) return falha("Esse lembrete já foi concluído.");
  const proxima = l.data ? proximaData(isoDeDataCalendario(l.data), l.recorrencia, l.diaRecorrencia) : null;

  const proximoId = await db.$transaction(async (tx) => {
    await tx.lembrete.update({ where: { id: l.id }, data: { concluidoEm: new Date() } });
    if (!proxima) return null;
    const { id: novo } = await tx.lembrete.create({
      data: {
        organizationId: l.organizationId,
        apartamentoId: l.apartamentoId,
        titulo: l.titulo,
        descricao: l.descricao,
        data: paraDataCalendario(proxima),
        hora: l.hora,
        importante: l.importante,
        recorrencia: l.recorrencia,
        diaRecorrencia: l.diaRecorrencia,
      },
      select: { id: true },
    });
    return novo;
  });
  refresh();
  return sucesso({ proximoId, proximaData: proxima });
}

/** Desfaz a conclusão: o lembrete volta a ficar aberto e a próxima ocorrência criada por ela sai. */
export async function reabrirLembrete(id: string, proximoId?: string | null): Promise<Resultado> {
  const ctx = await exigirContexto();
  await db.$transaction([
    db.lembrete.updateMany({ where: { id, organizationId: ctx.organizacaoId }, data: { concluidoEm: null } }),
    ...(proximoId ? [db.lembrete.deleteMany({ where: { id: proximoId, organizationId: ctx.organizacaoId, concluidoEm: null } })] : []),
  ]);
  refresh();
  return sucesso();
}

export async function apagarLembrete(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const { count } = await db.lembrete.deleteMany({ where: { id, organizationId: ctx.organizacaoId } });
  if (count === 0) return falha("Esse lembrete já tinha sido apagado.");
  refresh();
  return sucesso();
}
