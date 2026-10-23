import { hojeISO } from "@/lib/formatar";
import { garantirCobrancas } from "@/modulos/financeiro/servico";
import { concluirApagamentosVencidos } from "@/modulos/inquilinos/privacidade";
import { db } from "@/server/db";
import { atualizarIndices } from "@/server/indices";

/**
 * Rotina diária (agendada no deploy, ex.: Vercel Cron às 6h): gera as cobranças do mês de todas as
 * contas, atualiza IGP-M/IPCA e termina os apagamentos de LGPD cujo prazo fiscal passou. As telas também
 * geram as cobranças que faltarem ao abrir — nessa parte, isto só adianta o trabalho.
 * Protegida por CRON_SECRET (cabeçalho Authorization: Bearer …).
 */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const hoje = hojeISO();
  const contas = await db.organization.findMany({ select: { id: true } });
  let cobrancasCriadas = 0;
  for (const conta of contas) cobrancasCriadas += await garantirCobrancas(conta.id, hoje);
  await atualizarIndices(hoje);
  const apagamentosConcluidos = await concluirApagamentosVencidos(hoje);

  return Response.json({ hoje, contas: contas.length, cobrancasCriadas, apagamentosConcluidos });
}
