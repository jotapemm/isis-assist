import "server-only";
import { apagarDoArmazenamento } from "@/server/armazenamento";
import { db } from "@/server/db";

/**
 * Excluir a conta (LGPD, art. 18, VI): roda antes de o Better Auth apagar o usuário (src/server/auth.ts).
 * Cada residencial em que a pessoa está sozinha vai inteiro — apartamentos, inquilinos, contratos,
 * financeiro (o banco apaga em cascata a partir da organização) e os arquivos guardados.
 * Residencial com outras pessoas (v2) continua; só o vínculo dela some junto com o usuário.
 */
export async function apagarResidenciaisDoUsuario(usuarioId: string) {
  const vinculos = await db.member.findMany({
    where: { userId: usuarioId },
    select: { organizationId: true, organization: { select: { _count: { select: { members: true } } } } },
  });
  const sozinha = vinculos.filter((v) => v.organization._count.members === 1).map((v) => v.organizationId);
  if (sozinha.length === 0) return;

  const arquivos = await db.arquivo.findMany({ where: { organizationId: { in: sozinha } }, select: { chave: true } });
  await db.organization.deleteMany({ where: { id: { in: sozinha } } });
  await apagarDoArmazenamento(arquivos.map((a) => a.chave));
}
