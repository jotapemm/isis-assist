import "server-only";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";
import { formatarCpfCnpjOuVazio, formatarTelefoneOuVazio } from "./formatos";

/** Nome do residencial principal — aparece no topo do painel e no menu. */
export async function obterResumoConta(ctx: Contexto) {
  const propriedade = await db.propriedade.findFirst({
    where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, nome: true, cidade: true, uf: true },
  });
  return { propriedade };
}

/** Tudo que a tela de Configurações precisa, já no formato dos formulários (texto, sem Decimal). */
export async function obterConfiguracoes(ctx: Contexto) {
  const [config, propriedade] = await Promise.all([
    db.configuracao.findUnique({ where: { organizationId: ctx.organizacaoId } }),
    db.propriedade.findFirst({
      where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Decimal(5,2) chega como "10.00"; Number() tira os zeros que não dizem nada e a vírgula volta.
  const percentual = (valor: unknown, padrao: string) =>
    valor == null ? padrao : String(Number(valor)).replace(".", ",");

  return {
    locador: {
      locadorNome: config?.locadorNome ?? ctx.usuario.nome,
      locadorDocumento: formatarCpfCnpjOuVazio(config?.locadorDocumento),
      locadorTelefone: formatarTelefoneOuVazio(config?.locadorTelefone),
      locadorEmail: config?.locadorEmail ?? ctx.usuario.email,
      chavePix: config?.chavePix ?? "",
    },
    cobranca: {
      multaPercentual: percentual(config?.multaPercentual, "10"),
      jurosMensalPercentual: percentual(config?.jurosMensalPercentual, "1"),
      diasCarencia: String(config?.diasCarencia ?? 0),
    },
    endereco: {
      nome: propriedade?.nome ?? "",
      cep: propriedade?.cep ? `${propriedade.cep.slice(0, 5)}-${propriedade.cep.slice(5)}` : "",
      logradouro: propriedade?.logradouro ?? "",
      numero: propriedade?.numero ?? "",
      complemento: propriedade?.complemento ?? "",
      bairro: propriedade?.bairro ?? "",
      cidade: propriedade?.cidade ?? "",
      uf: (propriedade?.uf ?? "") as "",
    },
  };
}
