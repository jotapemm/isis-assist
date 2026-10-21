import type { z } from "zod";

/** O que toda server action devolve: deu certo, ou uma frase de erro (e, se for o caso, erros por campo). */
export type Resultado<T = undefined> =
  | { ok: true; dados: T }
  | { ok: false; erro: string; campos?: Record<string, string> };

export function sucesso(): Resultado;
export function sucesso<T>(dados: T): Resultado<T>;
export function sucesso<T>(dados?: T): Resultado<T | undefined> {
  return { ok: true, dados };
}

export function falha(erro: string, campos?: Record<string, string>): { ok: false; erro: string; campos?: Record<string, string> } {
  return { ok: false, erro, campos };
}

/** Converte o erro do zod em { campo: "mensagem" } para mostrar embaixo de cada campo. */
export function falhaDeValidacao(erro: z.ZodError) {
  const campos: Record<string, string> = {};
  for (const problema of erro.issues) {
    const caminho = problema.path.join(".");
    if (!campos[caminho]) campos[caminho] = problema.message;
  }
  return falha("Confira os campos destacados.", campos);
}
