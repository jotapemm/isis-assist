import { z } from "zod";
import { cpfOuCnpjValido } from "@/lib/documentos";
import { somenteDigitos } from "@/lib/mascaras";
import { PRIORIDADES_OS } from "./regras";

const texto = (maximo: number) => z.string().trim().max(maximo, "Texto longo demais.");
const telefoneOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || [10, 11].includes(somenteDigitos(v).length), "Telefone incompleto. Inclua o DDD.");
const emailOpcional = z.union([z.literal(""), z.email("E-mail inválido.")]);
const dataISO = (rotulo: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Escolha a data ${rotulo}.`);
const centavos = z.number().int().min(0).max(10_000_000_00, "Valor alto demais. Confira.");

export const esquemaPrestador = z.object({
  nome: z.string().trim().min(2, "Digite o nome.").max(120, "Nome longo demais."),
  especialidade: texto(60),
  telefone: telefoneOpcional,
  email: emailOpcional,
  documento: z.string().trim().refine((v) => v === "" || cpfOuCnpjValido(v), "CPF ou CNPJ inválido. Confira os números."),
  chavePix: texto(120),
  observacoes: texto(500),
});

/** Campos que dá para mudar depois de aberta (o imóvel não: mexeria no status dele). */
const camposDaOrdem = {
  titulo: z.string().trim().min(3, "Diga em poucas palavras o que é (ex.: vazamento no banheiro).").max(120, "Título longo demais."),
  descricao: texto(2000),
  prioridade: z.enum(PRIORIDADES_OS),
  /** "" = sem prestador ainda. */
  prestadorId: z.string(),
  custoEstimado: centavos,
};

export const esquemaNovaOrdem = z.object({
  ...camposDaOrdem,
  /** "" = área comum do residencial. */
  apartamentoId: z.string(),
  abertaEm: dataISO("de abertura"),
  /** Só vale para imóvel Livre ou Reservado (regras.ts: ofereceManutencao). */
  colocarEmManutencao: z.boolean(),
});

export const esquemaEditarOrdem = z.object(camposDaOrdem);

export const esquemaConcluirOrdem = z.object({
  concluidaEm: dataISO("da conclusão"),
  custoFinal: centavos,
  solucao: texto(1000),
  voltarStatus: z.boolean(),
});

export const esquemaCancelarOrdem = z.object({
  motivo: texto(500),
  voltarStatus: z.boolean(),
});

export type DadosPrestador = z.infer<typeof esquemaPrestador>;
export type DadosNovaOrdem = z.infer<typeof esquemaNovaOrdem>;
export type DadosEditarOrdem = z.infer<typeof esquemaEditarOrdem>;
export type DadosConcluirOrdem = z.infer<typeof esquemaConcluirOrdem>;
export type DadosCancelarOrdem = z.infer<typeof esquemaCancelarOrdem>;
