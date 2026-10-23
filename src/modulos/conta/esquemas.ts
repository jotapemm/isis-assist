import { z } from "zod";
import { cpfOuCnpjValido } from "@/lib/documentos";
import { somenteDigitos } from "@/lib/mascaras";
import { TIPOS_RESIDENCIAL } from "@/modulos/apartamentos/vocabulario";

// Esquemas compartilhados: o formulário valida no navegador e a action valida de novo no servidor.

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

/** "2,5" → 2.5 */
export function numeroDeTexto(texto: string) {
  return Number(texto.replace(",", "."));
}

const percentual = (oQue: string, maximo: number) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,3}([.,]\d{1,2})?$/, "Digite só o número, como 2 ou 2,5.")
    .refine((v) => numeroDeTexto(v) <= maximo, `${oQue} acima de ${maximo}% não parece certo. Confira.`);

const opcional = (maximo: number) => z.string().trim().max(maximo, "Texto longo demais.");

export const esquemaResidencial = z.object({
  nome: z.string().trim().min(2, "Digite o nome do residencial.").max(80, "Nome longo demais."),
  tipo: z.enum(TIPOS_RESIDENCIAL, "Escolha se é prédio ou casas."),
});

export const esquemaLocador = z.object({
  locadorNome: z.string().trim().min(2, "Digite o nome que vai sair no recibo.").max(120, "Nome longo demais."),
  locadorDocumento: z
    .string()
    .trim()
    .refine((v) => v === "" || cpfOuCnpjValido(v), "CPF ou CNPJ inválido. Confira os números."),
  locadorTelefone: z
    .string()
    .trim()
    .refine((v) => v === "" || [10, 11].includes(somenteDigitos(v).length), "Telefone incompleto. Inclua o DDD."),
  locadorEmail: z.union([z.literal(""), z.email("E-mail inválido.")]),
  chavePix: opcional(140),
});

export const esquemaCobranca = z.object({
  multaPercentual: percentual("Multa", 20),
  jurosMensalPercentual: percentual("Juros", 10),
  diasCarencia: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, "Digite um número de dias, de 0 a 30.")
    .refine((v) => Number(v) <= 30, "No máximo 30 dias."),
});

export const esquemaEndereco = z.object({
  nome: esquemaResidencial.shape.nome,
  tipo: esquemaResidencial.shape.tipo,
  cep: z.string().refine((v) => v === "" || somenteDigitos(v).length === 8, "CEP incompleto."),
  logradouro: opcional(120),
  numero: opcional(20),
  complemento: opcional(60),
  bairro: opcional(80),
  cidade: opcional(80),
  uf: z.union([z.literal(""), z.enum(UFS, "Escolha um estado da lista.")]),
});

export type DadosLocador = z.infer<typeof esquemaLocador>;
export type DadosCobranca = z.infer<typeof esquemaCobranca>;
export type DadosEndereco = z.infer<typeof esquemaEndereco>;
