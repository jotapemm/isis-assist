import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { apagarResidenciaisDoUsuario } from "@/modulos/conta/exclusao";
import { VERSAO_TERMOS } from "@/modulos/legal/versao";
import { db } from "./db";
import { emailRedefinirSenha, enviarEmail } from "./email";

const DIA = 60 * 60 * 24;

// Na Vercel, sem BETTER_AUTH_URL o endereço de produção vem da própria Vercel, e os links de
// pré-visualização (um por deploy) também podem entrar — senão o login responde "origem inválida".
const naVercel = (host: string | undefined) => (host ? `https://${host}` : undefined);

export const auth = betterAuth({
  appName: "Isis-Assist",
  baseURL: process.env.BETTER_AUTH_URL ?? naVercel(process.env.VERCEL_PROJECT_PRODUCTION_URL),
  trustedOrigins: [naVercel(process.env.VERCEL_URL), naVercel(process.env.VERCEL_BRANCH_URL)].filter((origem) => origem !== undefined),
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await enviarEmail({ para: user.email, ...emailRedefinirSenha(user.name, url) });
    },
  },
  // Ela usa o celular todo dia: sessão longa, renovada a cada acesso.
  session: { expiresIn: 30 * DIA, updateAge: DIA },
  user: {
    additionalFields: {
      // Aceite dos Termos e da Política: a versão vem do cadastro; a data, do servidor (prova do aceite).
      termosVersao: { type: "string", required: false, input: true },
      termosAceitosEm: { type: "date", required: false, input: false },
    },
    // Excluir a conta (LGPD): pede a senha na tela e leva junto o residencial inteiro.
    deleteUser: { enabled: true, beforeDelete: async (user) => apagarResidenciaisDoUsuario(user.id) },
  },
  databaseHooks: {
    user: {
      create: {
        // Ninguém cria conta sem aceitar a versão atual — nem chamando a API direto.
        before: async (user) => {
          if ((user as { termosVersao?: unknown }).termosVersao !== VERSAO_TERMOS) {
            throw new APIError("BAD_REQUEST", {
              code: "TERMOS_NAO_ACEITOS",
              message: "Aceite os Termos de Uso e a Política de Privacidade para criar a conta.",
            });
          }
          return { data: { ...user, termosAceitosEm: new Date() } };
        },
      },
    },
  },
  rateLimit: {
    // Ligado em produção (padrão do Better Auth). No banco porque, na Vercel, cada instância tem a
    // própria memória: o limite valeria por instância, e não por pessoa.
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 15 * 60, max: 3 },
      "/delete-user": { window: 60 * 60, max: 5 },
    },
  },
  // nextCookies precisa ser o último: grava os cookies quando o login roda em server action.
  plugins: [organization(), nextCookies()],
});
