import type { Metadata } from "next";
import { Suspense } from "react";
import { VoltarPara } from "@/components/comum/blocos";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { FormApartamento } from "@/modulos/apartamentos/componentes/form-apartamento";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Novo apartamento" };

export default function PaginaNovoApartamento() {
  return (
    <>
      <VoltarPara href="/apartamentos" rotulo="Apartamentos" />
      <CabecalhoPagina titulo="Novo apartamento" descricao="Ele começa como Livre. O status muda depois, na página do apartamento." />
      <Suspense fallback={<EsqueletoBloco className="h-96" />}>
        <Formulario />
      </Suspense>
    </>
  );
}

async function Formulario() {
  await exigirContexto();
  return <FormApartamento />;
}
