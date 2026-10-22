import { z } from "zod";
import { LIMITES_LOTE } from "./lote";
import { STATUS_APARTAMENTO } from "./status";

// Campos numéricos chegam do formulário como texto ("" = não informado) e viram número na action.
const inteiroOpcional = (rotulo: string, maximo: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d+$/.test(v), `${rotulo}: digite só números.`)
    .refine((v) => v === "" || Number(v) <= maximo, `${rotulo} acima de ${maximo} não parece certo.`);

export const esquemaApartamento = z.object({
  identificacao: z
    .string()
    .trim()
    .min(1, "Digite o número ou nome do apartamento.")
    .max(20, "Use no máximo 20 caracteres."),
  andar: inteiroOpcional("Andar", 200),
  bloco: z.string().trim().max(20, "Use no máximo 20 caracteres."),
  valorReferencia: z.number().int().min(0).max(100_000_00, "Valor alto demais. Confira."),
  quartos: inteiroOpcional("Quartos", 20),
  areaM2: inteiroOpcional("Área", 10_000),
  descricao: z.string().trim().max(500, "Texto longo demais (máximo 500 caracteres)."),
  observacoes: z.string().trim().max(2000, "Texto longo demais."),
});

export const esquemaLote = z.object({
  andares: z.number().int().min(1, "Pelo menos 1 andar.").max(LIMITES_LOTE.andares, `No máximo ${LIMITES_LOTE.andares} andares.`),
  porAndar: z
    .number()
    .int()
    .min(1, "Pelo menos 1 por andar.")
    .max(LIMITES_LOTE.porAndar, `No máximo ${LIMITES_LOTE.porAndar} por andar.`),
  comTerreo: z.boolean(),
  valorReferencia: z.number().int().min(0).max(100_000_00, "Valor alto demais. Confira."),
});

export const esquemaMudarStatus = z.object({
  status: z.enum(STATUS_APARTAMENTO, "Escolha um status."),
  motivo: z.string().trim().max(300, "Texto longo demais (máximo 300 caracteres)."),
});

export type DadosApartamento = z.infer<typeof esquemaApartamento>;
export type DadosLote = z.infer<typeof esquemaLote>;
export type DadosMudarStatus = z.infer<typeof esquemaMudarStatus>;

export const textoParaInteiro = (v: string) => (v.trim() === "" ? null : Number(v));
