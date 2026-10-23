import type { Metadata } from "next";
import { Suspense } from "react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { hojeISO } from "@/lib/formatar";
import { listarApartamentos, tipoDaConta } from "@/modulos/apartamentos/consultas";
import { PainelFinanceiro } from "@/modulos/financeiro/componentes/painel-financeiro";
import { financeiroDoMes } from "@/modulos/financeiro/consultas";
import { competenciaDe } from "@/modulos/financeiro/regras";
import { exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Financeiro" };

export default function PaginaFinanceiro({ searchParams }: PageProps<"/financeiro">) {
  return (
    <>
      <CabecalhoPagina titulo="Financeiro" descricao="Aluguéis do mês, pagamentos, recibos e despesas." />
      <Suspense fallback={<EsqueletoBloco className="h-[32rem]" />}>
        <Conteudo busca={searchParams} />
      </Suspense>
    </>
  );
}

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** ?mes=AAAA-MM escolhe o mês; ?aba=despesas&nova=1 e ?pagar=<cobrança> vêm dos atalhos. */
async function Conteudo({ busca }: { busca: PageProps<"/financeiro">["searchParams"] }) {
  const [ctx, parametros] = await Promise.all([exigirContexto(), busca]);
  const mes = texto(parametros.mes);
  const competencia = mes && /^\d{4}-\d{2}$/.test(mes) ? `${mes}-01` : competenciaDe(hojeISO());

  const [dados, tipo, aptos, config] = await Promise.all([
    financeiroDoMes(ctx, competencia),
    tipoDaConta(ctx),
    listarApartamentos(ctx),
    db.configuracao.findUnique({ where: { organizationId: ctx.organizacaoId }, select: { chavePix: true } }),
  ]);

  return (
    <PainelFinanceiro
      dados={dados}
      competencia={competencia}
      tipo={tipo}
      chavePix={config?.chavePix ?? null}
      aptos={aptos.map((a) => ({ id: a.id, identificacao: a.identificacao }))}
      abaInicial={texto(parametros.aba) === "despesas" ? "despesas" : "alugueis"}
      pagarInicial={texto(parametros.pagar)}
      novaDespesaInicial={texto(parametros.nova) === "1"}
    />
  );
}
