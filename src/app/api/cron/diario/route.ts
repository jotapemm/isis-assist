import { hojeISO } from "@/lib/formatar";
import { garantirCobrancas } from "@/modulos/financeiro/servico";
import { db } from "@/server/db";
import { atualizarIndices } from "@/server/indices";

/**
 * Rotina diária (agendada no deploy, ex.: Vercel Cron às 6h): gera as cobranças do mês de todas as
 * contas e atualiza IGP-M/IPCA. As telas também geram o que faltar ao abrir — isto só adianta o trabalho.
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

  return Response.json({ hoje, contas: contas.length, cobrancasCriadas });
}
