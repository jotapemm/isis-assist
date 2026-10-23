import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
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
  // nextCookies precisa ser o último: grava os cookies quando o login roda em server action.
  plugins: [organization(), nextCookies()],
});
