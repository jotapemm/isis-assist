import "server-only";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";

export async function listarInquilinos(ctx: Contexto) {
  const inquilinos = await db.inquilino.findMany({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
    select: { id: true, nome: true, cpf: true, telefone: true, email: true, _count: { select: { fiadores: true } } },
  });
  return inquilinos
    .map(({ _count, ...i }) => ({ ...i, temFiador: _count.fiadores > 0 }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export type InquilinoResumo = Awaited<ReturnType<typeof listarInquilinos>>[number];

export async function obterInquilino(ctx: Contexto, id: string) {
  return db.inquilino.findFirst({
    where: { id, organizationId: ctx.organizacaoId, arquivadoEm: null },
    include: {
      fiadores: { orderBy: { createdAt: "asc" }, take: 1 },
      arquivos: {
        where: { categoria: "DOCUMENTO" },
        orderBy: { createdAt: "desc" },
        select: { id: true, nomeOriginal: true, tipoMime: true, tamanhoBytes: true, createdAt: true },
      },
    },
  });
}

export type InquilinoDetalhe = NonNullable<Awaited<ReturnType<typeof obterInquilino>>>;
