import { z } from "zod";
import { CATEGORIAS_DESPESA, FORMAS } from "./regras";

const dataISO = (rotulo: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, `Escolha a data ${rotulo}.`);
const centavos = (rotulo: string) =>
  z.number().int().min(1, `Digite o valor ${rotulo}.`).max(100_000_000, "Valor alto demais. Confira.");

export const esquemaPagamento = z.object({
  data: dataISO("do pagamento"),
  valorPago: centavos("recebido"),
  /** Dispensa multa e juros deste pagamento. */
  isentar: z.boolean(),
  forma: z.enum(Object.keys(FORMAS) as [keyof typeof FORMAS, ...(keyof typeof FORMAS)[]]),
  observacao: z.string().trim().max(300, "Texto longo demais."),
});

export const esquemaAjusteCobranca = z.object({
  valor: centavos("do aluguel"),
  vencimento: dataISO("do vencimento"),
  descricao: z.string().trim().max(200, "Texto longo demais."),
});

export const esquemaDespesa = z.object({
  data: dataISO("da despesa"),
  categoria: z.enum(Object.keys(CATEGORIAS_DESPESA) as [keyof typeof CATEGORIAS_DESPESA, ...(keyof typeof CATEGORIAS_DESPESA)[]]),
  descricao: z.string().trim().min(2, "Diga do que foi a despesa.").max(120, "Texto longo demais."),
  valor: centavos("da despesa"),
  /** "" = despesa geral do residencial. */
  apartamentoId: z.string(),
  observacao: z.string().trim().max(500, "Texto longo demais."),
});

export type DadosPagamento = z.infer<typeof esquemaPagamento>;
export type DadosAjusteCobranca = z.infer<typeof esquemaAjusteCobranca>;
export type DadosDespesa = z.infer<typeof esquemaDespesa>;
