// Quanto tempo o nome e o CPF de quem pediu para apagar os dados ainda ficam guardados (LGPD, art. 16, I).

/** Nome que fica no lugar de quem teve os dados apagados de vez (contratos e recibos antigos). */
export const NOME_APAGADO = "Ex-inquilino";

/**
 * Nome e CPF aparecem nos recibos e no imposto de renda da proprietária: o aluguel de um ano entra na
 * declaração do ano seguinte, e a Receita pode conferir essa declaração por 5 anos. Então guardamos
 * até 31/12 do 6º ano depois do último pagamento. Sem pagamento nenhum, não há por que guardar.
 */
export function guardarNomeAte(ultimoPagamento: string | null) {
  if (!ultimoPagamento) return null;
  return `${Number(ultimoPagamento.slice(0, 4)) + 6}-12-31`;
}
