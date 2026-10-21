import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({ plugins: [organizationClient()] });

// O Better Auth responde com códigos em inglês; aqui viram frases que a usuária entende.
const MENSAGENS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha não conferem.",
  USER_ALREADY_EXISTS: "Já existe uma conta com esse e-mail. Tente entrar.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com esse e-mail. Tente entrar.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "A senha está longa demais.",
  INVALID_EMAIL: "Confira o e-mail digitado.",
  INVALID_TOKEN: "Este link expirou ou já foi usado. Peça um novo.",
  INVALID_PASSWORD: "Senha atual incorreta.",
  TOO_MANY_REQUESTS: "Muitas tentativas seguidas. Espere um minuto e tente de novo.",
};

export function mensagemDeErro(erro: { code?: string; status?: number } | null | undefined) {
  if (!erro) return "Algo deu errado. Tente de novo.";
  if (erro.code && MENSAGENS[erro.code]) return MENSAGENS[erro.code];
  if (erro.status === 429) return MENSAGENS.TOO_MANY_REQUESTS;
  return "Algo deu errado. Tente de novo.";
}
