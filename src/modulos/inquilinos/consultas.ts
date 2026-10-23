import "server-only";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";

/** Os atuais, ou os arquivados (ex-inquilinos), onde a proprietária atende pedidos de LGPD de quem já saiu. */
export async function listarInquilinos(ctx: Contexto, { arquivados = false } = {}) {
  const inquilinos = await db.inquilino.findMany({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: arquivados ? { not: null } : null },
    select: {
      id: true,
      nome: true,
      cpf: true,
      telefone: true,
      email: true,
      aceitaWhatsapp: true,
      dadosApagadosEm: true,
      _count: { select: { fiadores: true } },
    },
  });
  return inquilinos
    .map(({ _count, ...i }) => ({ ...i, temFiador: _count.fiadores > 0 }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
}

export type InquilinoResumo = Awaited<ReturnType<typeof listarInquilinos>>[number];

export async function contarArquivados(ctx: Contexto) {
  return db.inquilino.count({ where: { organizationId: ctx.organizacaoId, arquivadoEm: { not: null } } });
}

export async function obterInquilino(ctx: Contexto, id: string) {
  return db.inquilino.findFirst({
    // Arquivados também abrem: é por aqui que se atende o pedido de LGPD de quem já saiu.
    where: { id, organizationId: ctx.organizacaoId },
    include: {
      fiadores: { orderBy: { createdAt: "asc" }, take: 1 },
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
          apartamento: { select: { id: true, identificacao: true } },
        },
      },
      arquivos: {
        where: { categoria: "DOCUMENTO" },
        orderBy: { createdAt: "desc" },
        select: { id: true, nomeOriginal: true, tipoMime: true, tamanhoBytes: true, createdAt: true },
      },
    },
  });
}

export type InquilinoDetalhe = NonNullable<Awaited<ReturnType<typeof obterInquilino>>>;
