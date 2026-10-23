import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { formatarCpfCnpjOuVazio, formatarTelefoneOuVazio } from "@/modulos/conta/formatos";
import { FormInquilino } from "@/modulos/inquilinos/componentes/form-inquilino";
import { obterInquilino } from "@/modulos/inquilinos/consultas";
import { isoDeDataCalendario } from "@/lib/formatar";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Editar inquilino" };

export default function PaginaEditarInquilino({ params }: PageProps<"/inquilinos/[id]/editar">) {
  return (
    <Suspense fallback={<EsqueletoBloco className="h-[36rem]" />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: PageProps<"/inquilinos/[id]/editar">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const inq = await obterInquilino(ctx, id);
  if (!inq) notFound();
  // Arquivado (ou com os dados apagados) não se edita: primeiro volta para a lista.
  if (inq.arquivadoEm) redirect(`/inquilinos/${inq.id}`);

  const fiador = inq.fiadores[0];
  return (
    <>
      <VoltarPara href={`/inquilinos/${inq.id}`} rotulo={inq.nome.split(" ")[0]} />
      <h1 className="mb-6 font-heading text-[1.85rem] leading-tight lg:mb-8 lg:text-[2.25rem]">Editar {inq.nome}</h1>
      <FormInquilino
        id={inq.id}
        inicial={{
          nome: inq.nome,
          cpf: formatarCpfCnpjOuVazio(inq.cpf),
          rg: inq.rg ?? "",
          dataNascimento: inq.dataNascimento ? isoDeDataCalendario(inq.dataNascimento) : "",
          telefone: formatarTelefoneOuVazio(inq.telefone),
          email: inq.email ?? "",
          profissao: inq.profissao ?? "",
          rendaMensal: inq.rendaMensal ?? 0,
          contatoEmergenciaNome: inq.contatoEmergenciaNome ?? "",
          contatoEmergenciaTelefone: formatarTelefoneOuVazio(inq.contatoEmergenciaTelefone),
          contatoEmergenciaParentesco: inq.contatoEmergenciaParentesco ?? "",
          aceitaWhatsapp: inq.aceitaWhatsapp,
          observacoes: inq.observacoes ?? "",
          temFiador: Boolean(fiador),
          fiador: {
            nome: fiador?.nome ?? "",
            cpf: formatarCpfCnpjOuVazio(fiador?.cpf),
            telefone: formatarTelefoneOuVazio(fiador?.telefone),
            email: fiador?.email ?? "",
            endereco: fiador?.endereco ?? "",
          },
        }}
      />
    </>
  );
}
