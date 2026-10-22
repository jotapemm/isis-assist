import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2 } from "lucide-react";
import { VoltarPara } from "@/components/comum/blocos";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Button } from "@/components/ui/button";
import { hojeISO } from "@/lib/formatar";
import { AssistenteContrato } from "@/modulos/contratos/componentes/assistente-contrato";
import { dadosParaNovoContrato } from "@/modulos/contratos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Novo contrato" };

export default function PaginaNovoContrato({ searchParams }: PageProps<"/contratos/novo">) {
  return (
    <>
      <VoltarPara href="/contratos" rotulo="Contratos" />
      <CabecalhoPagina titulo="Novo contrato" />
      <Suspense fallback={<EsqueletoBloco className="h-[30rem]" />}>
        <Assistente busca={searchParams} />
      </Suspense>
    </>
  );
}

/** ?apartamento=… e ?inquilino=… vêm dos botões "Alugar este apartamento" e "Novo contrato" do inquilino. */
async function Assistente({ busca }: { busca: PageProps<"/contratos/novo">["searchParams"] }) {
  const [ctx, parametros] = await Promise.all([exigirContexto(), busca]);
  const dados = await dadosParaNovoContrato(ctx);
  const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  if (dados.aptos.length === 0) {
    return (
      <EstadoVazio icone={Building2} titulo="Cadastre os apartamentos primeiro" descricao="O contrato liga um inquilino a um apartamento.">
        <Button asChild size="lg">
          <Link href="/apartamentos">Cadastrar apartamentos</Link>
        </Button>
      </EstadoVazio>
    );
  }

  return (
    <AssistenteContrato
      dados={dados}
      hoje={hojeISO()}
      apartamentoInicial={texto(parametros.apartamento)}
      inquilinoInicial={texto(parametros.inquilino)}
    />
  );
}
