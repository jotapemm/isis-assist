import type { Metadata } from "next";
import { Suspense } from "react";
import { VoltarPara } from "@/components/comum/blocos";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoFormulario } from "@/components/comum/esqueleto";
import { tipoDaConta } from "@/modulos/apartamentos/consultas";
import { FormNovaOrdem } from "@/modulos/manutencoes/componentes/form-nova-ordem";
import { dadosParaNovaOrdem } from "@/modulos/manutencoes/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Nova ordem de serviço" };

export default function PaginaNovaOrdem({ searchParams }: PageProps<"/manutencoes/nova">) {
  return (
    <>
      <VoltarPara href="/manutencoes" rotulo="Manutenções" />
      <CabecalhoPagina titulo="Nova ordem de serviço" descricao="O que quebrou, onde, com que pressa e quem vai consertar." />
      <Suspense fallback={<EsqueletoFormulario />}>
        <Conteudo busca={searchParams} />
      </Suspense>
    </>
  );
}

/** ?apto=<id> vem do botão "Abrir ordem de serviço" na página do imóvel. */
async function Conteudo({ busca }: { busca: PageProps<"/manutencoes/nova">["searchParams"] }) {
  const [ctx, parametros] = await Promise.all([exigirContexto(), busca]);
  const [dados, tipo] = await Promise.all([dadosParaNovaOrdem(ctx), tipoDaConta(ctx)]);
  const apto = typeof parametros.apto === "string" ? parametros.apto : undefined;
  return <FormNovaOrdem tipo={tipo} hoje={dados.hoje} aptos={dados.aptos} prestadores={dados.prestadores} aptoInicial={apto} />;
}
