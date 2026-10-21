import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";

/**
 * Quem está usando e em qual conta. Toda consulta e ação do domínio recebe isto e filtra por
 * `organizacaoId` — é a única porta de entrada para dados multi-tenant.
 * `papel` existe desde já para o portal do inquilino (v2) entrar sem mexer nas consultas.
 */
export type Contexto = {
  usuario: { id: string; nome: string; email: string };
  organizacaoId: string;
  papel: "GESTOR";
};

export const obterSessao = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function exigirSessao() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

export const exigirContexto = cache(async (): Promise<Contexto> => {
  const { user, session } = await exigirSessao();

  // A conta ativa vem da sessão; se ainda não houver (ex.: logo após o cadastro) ou se o vínculo
  // tiver sido removido, cai na primeira conta da qual o usuário é membro.
  const vinculo =
    (session.activeOrganizationId &&
      (await db.member.findFirst({
        where: { userId: user.id, organizationId: session.activeOrganizationId },
      }))) ||
    (await db.member.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }));

  if (!vinculo) redirect("/boas-vindas");

  return {
    usuario: { id: user.id, nome: user.name, email: user.email },
    organizacaoId: vinculo.organizationId,
    papel: "GESTOR",
  };
});
