import { z } from "zod";
import { cpfValido } from "@/lib/documentos";
import { mesesEntre } from "@/lib/datas";
import { somenteDigitos } from "@/lib/mascaras";

export const INDICES_REAJUSTE = ["IGPM", "IPCA", "FIXO", "NENHUM"] as const;

const dataISO = (rotulo: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Escolha a data de ${rotulo}.`);

const percentualTexto = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{1,2}([.,]\d{1,3})?$/.test(v), "Digite só o número, como 5 ou 4,5.");

export const numeroDePercentual = (texto: string) => Number(texto.replace(",", "."));

/** Campos comuns ao contrato novo e à edição. */
const camposDoContrato = {
  dataFim: dataISO("término"),
  valorAluguel: z.number().int().min(1, "Digite o valor do aluguel.").max(100_000_00, "Valor alto demais. Confira."),
  diaVencimento: z.number().int().min(1, "Escolha o dia do vencimento.").max(31, "O dia vai de 1 a 31."),
  valorCaucao: z.number().int().min(0).max(1_000_000_00, "Valor alto demais. Confira."),
  indiceReajuste: z.enum(INDICES_REAJUSTE),
  percentualFixo: percentualTexto,
  fiadorId: z.string(),
  observacoes: z.string().trim().max(2000, "Texto longo demais."),
};

function conferirPercentualFixo(d: { indiceReajuste: string; percentualFixo: string }, ctx: z.RefinementCtx) {
  if (d.indiceReajuste === "FIXO" && (d.percentualFixo === "" || numeroDePercentual(d.percentualFixo) <= 0)) {
    ctx.addIssue({ code: "custom", path: ["percentualFixo"], message: "Digite o percentual do reajuste." });
  }
}

export const esquemaNovoContrato = z
  .object({
    apartamentoId: z.string().min(1, "Escolha o apartamento."),
    inquilinoId: z.string(),
    cadastrarInquilino: z.boolean(),
    novoInquilino: z.object({
      nome: z.string().trim().max(120, "Nome longo demais."),
      cpf: z.string().trim().refine((v) => v === "" || cpfValido(v), "CPF inválido. Confira os números."),
      telefone: z
        .string()
        .trim()
        .refine((v) => v === "" || [10, 11].includes(somenteDigitos(v).length), "Telefone incompleto. Inclua o DDD."),
    }),
    dataInicio: dataISO("início"),
    ...camposDoContrato,
  })
  .superRefine((d, ctx) => {
    if (d.cadastrarInquilino && d.novoInquilino.nome.length < 3) {
      ctx.addIssue({ code: "custom", path: ["novoInquilino", "nome"], message: "Digite o nome completo do inquilino." });
    }
    if (!d.cadastrarInquilino && !d.inquilinoId) {
      ctx.addIssue({ code: "custom", path: ["inquilinoId"], message: "Escolha quem vai morar no apartamento." });
    }
    if (d.dataFim <= d.dataInicio) {
      ctx.addIssue({ code: "custom", path: ["dataFim"], message: "O término precisa ser depois do início." });
    } else if (mesesEntre(d.dataInicio, d.dataFim) > 120) {
      ctx.addIssue({ code: "custom", path: ["dataFim"], message: "Contrato de mais de 10 anos não parece certo. Confira." });
    }
    conferirPercentualFixo(d, ctx);
  });

export const esquemaEditarContrato = z.object(camposDoContrato).superRefine(conferirPercentualFixo);

export const MOTIVOS_ENCERRAMENTO = [
  "Fim do prazo",
  "Inquilino pediu para sair",
  "Pedi o imóvel de volta",
  "Falta de pagamento",
  "Outro motivo",
] as const;

export const esquemaEncerrar = z.object({
  dataSaida: dataISO("saída"),
  motivo: z.enum(MOTIVOS_ENCERRAMENTO, "Escolha o motivo."),
  detalhe: z.string().trim().max(300, "Texto longo demais."),
  valorCaucaoDevolvido: z.number().int().min(0),
  statusApto: z.enum(["LIVRE", "REFORMA", "MANUTENCAO"]),
});

export const esquemaReajuste = z.object({
  /** Percentual a aplicar; 0 com `manterValor` registra que o valor ficou igual neste ano. */
  percentual: z.number().min(-50, "Percentual fora do normal. Confira.").max(100, "Percentual fora do normal. Confira."),
  manterValor: z.boolean(),
  observacao: z.string().trim().max(300, "Texto longo demais."),
});

export type DadosNovoContrato = z.infer<typeof esquemaNovoContrato>;
export type DadosEditarContrato = z.infer<typeof esquemaEditarContrato>;
export type DadosEncerrar = z.infer<typeof esquemaEncerrar>;
