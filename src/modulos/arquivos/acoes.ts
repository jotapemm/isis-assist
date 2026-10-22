"use server";

import { refresh } from "next/cache";
import { falha, sucesso, type Resultado } from "@/lib/resultado";
import { armazenamento } from "@/server/armazenamento";
import { exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";

export async function apagarArquivo(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const arquivo = await db.arquivo.findFirst({ where: { id, organizationId: ctx.organizacaoId } });
  if (!arquivo) return falha("Esse arquivo já não existe.");

  await db.arquivo.delete({ where: { id: arquivo.id } });
  await armazenamento().apagar(arquivo.chave);
  refresh();
  return sucesso();
}

/** Coloca a foto escolhida como capa (primeira da galeria). */
export async function definirCapa(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const foto = await db.arquivo.findFirst({
    where: { id, organizationId: ctx.organizacaoId, categoria: "FOTO_APTO" },
    select: { id: true, apartamentoId: true },
  });
  if (!foto?.apartamentoId) return falha("Essa foto já não existe.");

  const fotos = await db.arquivo.findMany({
    where: { organizationId: ctx.organizacaoId, apartamentoId: foto.apartamentoId, categoria: "FOTO_APTO" },
    orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const novaOrdem = [foto.id, ...fotos.map((f) => f.id).filter((f) => f !== foto.id)];
  await db.$transaction(novaOrdem.map((fotoId, ordem) => db.arquivo.update({ where: { id: fotoId }, data: { ordem } })));
  refresh();
  return sucesso();
}
