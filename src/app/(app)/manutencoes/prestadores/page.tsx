import type { Metadata } from "next";
import { Suspense } from "react";
import { VoltarPara } from "@/components/comum/blocos";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { PainelPrestadores } from "@/modulos/manutencoes/componentes/painel-prestadores";
import { listarPrestadores } from "@/modulos/manutencoes/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Prestadores" };

export default function PaginaPrestadores() {
  return (
    <>
      <VoltarPara href="/manutencoes" rotulo="Manutenções" />
      <CabecalhoPagina titulo="Prestadores" descricao="Quem faz os consertos, com o contato à mão e quanto já recebeu." />
      <Suspense fallback={<EsqueletoBloco className="h-80" />}>
        <Conteudo />
      </Suspense>
    </>
  );
}

async function Conteudo() {
  const ctx = await exigirContexto();
  return <PainelPrestadores prestadores={await listarPrestadores(ctx)} />;
}
