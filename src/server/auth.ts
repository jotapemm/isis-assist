import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { db } from "./db";
import { emailRedefinirSenha, enviarEmail } from "./email";

const DIA = 60 * 60 * 24;

export const auth = betterAuth({
  appName: "Isis-Assist",
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
