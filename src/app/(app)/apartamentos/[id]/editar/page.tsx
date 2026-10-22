import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { FormApartamento } from "@/modulos/apartamentos/componentes/form-apartamento";
import { obterApartamento } from "@/modulos/apartamentos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Editar apartamento" };

export default function PaginaEditarApartamento({ params }: PageProps<"/apartamentos/[id]/editar">) {
  return (
    <Suspense fallback={<EsqueletoBloco className="h-96" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/apartamentos/[id]/editar">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const apto = await obterApartamento(ctx, id);
  if (!apto) notFound();

  const texto = (n: number | null) => (n === null ? "" : String(n));
  return (
    <>
      <VoltarPara href={`/apartamentos/${apto.id}`} rotulo={`Apto ${apto.identificacao}`} />
      <h1 className="mb-6 font-heading text-[1.85rem] leading-tight lg:mb-8 lg:text-[2.25rem]">Editar apto {apto.identificacao}</h1>
      <FormApartamento
        id={apto.id}
        inicial={{
          identificacao: apto.identificacao,
          andar: texto(apto.andar),
          bloco: apto.bloco ?? "",
          valorReferencia: apto.valorReferencia ?? 0,
          quartos: texto(apto.quartos),
          areaM2: texto(apto.areaM2),
          descricao: apto.descricao ?? "",
          observacoes: apto.observacoes ?? "",
        }}
      />
    </>
  );
}
