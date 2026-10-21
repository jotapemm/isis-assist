import { z } from "zod";

const email = z.string().trim().min(1, "Digite seu e-mail.").pipe(z.email("Confira o e-mail digitado."));
const senhaNova = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128, "Senha longa demais.");

export const esquemaEntrar = z.object({
  email,
  senha: z.string().min(1, "Digite sua senha."),
});

export const esquemaCriarConta = z.object({
  nome: z.string().trim().min(2, "Digite seu nome.").max(120, "Nome longo demais."),
  email,
  senha: senhaNova,
});

export const esquemaEsqueciSenha = z.object({ email });

export const esquemaNovaSenha = z
  .object({ senha: senhaNova, confirmacao: z.string() })
  .refine((d) => d.senha === d.confirmacao, { message: "As duas senhas não são iguais.", path: ["confirmacao"] });

export const esquemaTrocarSenha = z
  .object({ atual: z.string().min(1, "Digite a senha atual."), senha: senhaNova, confirmacao: z.string() })
  .refine((d) => d.senha === d.confirmacao, { message: "As duas senhas não são iguais.", path: ["confirmacao"] });
