import type { Metadata } from "next";
import { Suspense } from "react";
import { VoltarPara } from "@/components/comum/blocos";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { FormApartamento } from "@/modulos/apartamentos/componentes/form-apartamento";
import { vocabularioDaConta } from "@/modulos/apartamentos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Novo imóvel" };

export default function PaginaNovoApartamento() {
  return (
    <Suspense fallback={<EsqueletoBloco className="h-96" />}>
      <Formulario />
    </Suspense>
  );
}

async function Formulario() {
  const ctx = await exigirContexto();
  const v = await vocabularioDaConta(ctx);
  return (
    <>
      <VoltarPara href="/apartamentos" rotulo={v.Plural} />
      <CabecalhoPagina
        titulo={`${v.novo} ${v.singular}`}
        descricao={`${v.o === "a" ? "Ela começa" : "Ele começa"} como Livre. O status muda depois, na página ${v.do} ${v.singular}.`}
      />
      <FormApartamento tipo={v.tipo} />
    </>
  );
}
