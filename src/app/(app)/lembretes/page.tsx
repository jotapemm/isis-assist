import type { Metadata } from "next";
import { Suspense } from "react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { hojeISO } from "@/lib/formatar";
import { listarApartamentos, tipoDaConta } from "@/modulos/apartamentos/consultas";
import { competenciaDe } from "@/modulos/financeiro/regras";
import { PainelLembretes } from "@/modulos/lembretes/componentes/painel-lembretes";
import { avisosDoSistema, eventosDoMes, listarLembretes } from "@/modulos/lembretes/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Lembretes" };

export default function PaginaLembretes({ searchParams }: PageProps<"/lembretes">) {
  return (
    <>
      <CabecalhoPagina titulo="Lembretes" descricao="O que fazer e quando, as anotações do dia a dia e os avisos dos contratos." />
      <Suspense fallback={<EsqueletoBloco className="h-[28rem]" />}>
        <Conteudo busca={searchParams} />
      </Suspense>
    </>
  );
}

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** ?ver=calendario&mes=AAAA-MM mostra o calendário; ?novo=1 (atalho "+") e ?apto=<id> abrem um lembrete novo. */
async function Conteudo({ busca }: { busca: PageProps<"/lembretes">["searchParams"] }) {
  const [ctx, parametros] = await Promise.all([exigirContexto(), busca]);
  const ver = texto(parametros.ver) === "calendario" ? "calendario" : "lista";
  const mes = texto(parametros.mes);
  const competencia = mes && /^\d{4}-\d{2}$/.test(mes) ? `${mes}-01` : competenciaDe(hojeISO());
  const apto = texto(parametros.apto);

  const [lembretes, avisos, eventos, aptos, tipo] = await Promise.all([
    listarLembretes(ctx),
    ver === "lista" ? avisosDoSistema(ctx) : Promise.resolve([]),
    ver === "calendario" ? eventosDoMes(ctx, competencia) : Promise.resolve([]),
    listarApartamentos(ctx),
    tipoDaConta(ctx),
  ]);

  return (
    <PainelLembretes
      ver={ver}
      competencia={competencia}
      hoje={hojeISO()}
      lembretes={lembretes}
      avisos={avisos}
      eventosDoMes={eventos}
      aptos={aptos.map((a) => ({ id: a.id, identificacao: a.identificacao }))}
      tipo={tipo}
      abrirNovo={texto(parametros.novo) === "1" || Boolean(apto)}
      aptoInicial={apto}
    />
  );
}
