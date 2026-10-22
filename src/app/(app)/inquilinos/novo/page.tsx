import type { Metadata } from "next";
import { Suspense } from "react";
import { VoltarPara } from "@/components/comum/blocos";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { FormInquilino } from "@/modulos/inquilinos/componentes/form-inquilino";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Novo inquilino" };

export default function PaginaNovoInquilino() {
  return (
    <>
      <VoltarPara href="/inquilinos" rotulo="Inquilinos" />
      <CabecalhoPagina titulo="Novo inquilino" />
      <Suspense fallback={<EsqueletoBloco className="h-[36rem]" />}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirContexto();
  return <FormInquilino />;
}
