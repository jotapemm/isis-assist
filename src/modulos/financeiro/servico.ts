import "server-only";
import { somarMeses } from "@/lib/datas";
import { isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { competenciaDe, vencimentoNoMes } from "./regras";

/**
 * Cria as cobranças do mês para os contratos ativos — idempotente pela `chaveGeracao`
 * ("contrato:AAAA-MM"): rodar de novo (painel, financeiro, rotina diária) nunca duplica.
 *
 * Regra do primeiro mês: se o vencimento do mês cai antes do início do contrato, a primeira
 * cobrança é a do mês seguinte (quem entra no dia 22 com vencimento dia 5 paga a partir do próximo dia 5).
 */
export async function garantirCobrancas(organizacaoId: string, hoje: string) {
  const competencia = competenciaDe(hoje);
  const fimDoMes = somarMeses(competencia, 1);
  const contratos = await db.contrato.findMany({
    where: { organizationId: organizacaoId, status: "ATIVO", dataInicio: { lt: paraDataCalendario(fimDoMes) } },
    select: { id: true, dataInicio: true, diaVencimento: true, valorAluguel: true },
  });

  const novas = contratos.flatMap((c) => {
    const vencimento = vencimentoNoMes(competencia, c.diaVencimento);
    if (vencimento < isoDeDataCalendario(c.dataInicio)) return [];
    return [
      {
        organizationId: organizacaoId,
        contratoId: c.id,
        competencia: paraDataCalendario(competencia),
        vencimento: paraDataCalendario(vencimento),
        valor: c.valorAluguel,
        chaveGeracao: `${c.id}:${competencia.slice(0, 7)}`,
      },
    ];
  });
  if (novas.length === 0) return 0;
  const { count } = await db.cobranca.createMany({ data: novas, skipDuplicates: true });
  return count;
}

/** Recalcula o status de uma cobrança a partir dos pagamentos que valem (não estornados). */
export async function atualizarStatusDaCobranca(cobrancaId: string, cliente: Prisma.TransactionClient = db) {
  const cobranca = await cliente.cobranca.findUniqueOrThrow({
    where: { id: cobrancaId },
    select: { valor: true, status: true, pagamentos: { where: { estornadoEm: null }, select: { valorPrincipal: true } } },
  });
  if (cobranca.status === "CANCELADO") return;
  const pago = cobranca.pagamentos.reduce((soma, p) => soma + p.valorPrincipal, 0);
  const status = pago >= cobranca.valor ? "PAGO" : pago > 0 ? "PARCIAL" : "PENDENTE";
  await cliente.cobranca.update({ where: { id: cobrancaId }, data: { status } });
}
