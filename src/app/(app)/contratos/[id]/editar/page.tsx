import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { FormEditarContrato } from "@/modulos/contratos/componentes/form-editar-contrato";
import { vocabularioDaConta } from "@/modulos/apartamentos/consultas";
import { obterContrato } from "@/modulos/contratos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Editar contrato" };

export default function PaginaEditarContrato({ params }: PageProps<"/contratos/[id]/editar">) {
  return (
    <Suspense fallback={<EsqueletoBloco className="h-[30rem]" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/contratos/[id]/editar">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const [c, v] = await Promise.all([obterContrato(ctx, id), vocabularioDaConta(ctx)]);
  if (!c) notFound();
  if (c.status !== "ATIVO") redirect(`/contratos/${c.id}`);

  return (
    <>
      <VoltarPara href={`/contratos/${c.id}`} rotulo={`Contrato ${v.do} ${v.nomeMinusculo(c.apartamento.identificacao)}`} />
      <h1 className="mb-1 font-heading text-[1.85rem] leading-tight lg:text-[2.25rem]">Editar contrato</h1>
      <p className="mb-6 text-muted-foreground lg:mb-8">
        {v.nome(c.apartamento.identificacao)} · {c.inquilino.nome}. Para trocar {v.o} {v.singular} ou o inquilino, encerre este contrato e
        faça outro.
      </p>
      <FormEditarContrato
        id={c.id}
        inicio={c.dataInicio}
        fiador={c.inquilino.fiadores[0] ?? null}
        inicial={{
          dataFim: c.dataFim,
          valorAluguel: c.valorAluguel,
          diaVencimento: c.diaVencimento,
          valorCaucao: c.valorCaucao ?? 0,
          indiceReajuste: c.indiceReajuste,
          percentualFixo: c.percentualFixo !== null ? String(c.percentualFixo).replace(".", ",") : "",
          fiadorId: c.fiador?.id ?? "",
          observacoes: c.observacoes ?? "",
        }}
      />
    </>
  );
}
