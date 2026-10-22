import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FileSignature, Plus } from "lucide-react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Button } from "@/components/ui/button";
import { hojeISO } from "@/lib/formatar";
import { ListaContratos } from "@/modulos/contratos/componentes/lista-contratos";
import { listarContratos } from "@/modulos/contratos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Contratos" };

export default function PaginaContratos() {
  return (
    <>
      <CabecalhoPagina
        titulo="Contratos"
        descricao="Quem aluga o quê, por quanto e até quando."
        acoes={
          <Button asChild>
            <Link href="/contratos/novo">
              <Plus className="size-4" />
              Novo contrato
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<EsqueletoBloco className="h-96" />}>
        <Conteudo />
      </Suspense>
    </>
  );
}

async function Conteudo() {
  const ctx = await exigirContexto();
  const contratos = await listarContratos(ctx);

  if (contratos.length === 0) {
    return (
      <EstadoVazio
        icone={FileSignature}
        titulo="Nenhum contrato ainda"
        descricao="Escolha o apartamento, quem vai morar e os valores. Ao ativar, o apartamento passa para Ocupado e o reajuste anual fica agendado."
      >
        <Button asChild size="lg">
          <Link href="/contratos/novo">
            <Plus className="size-5" />
            Fazer o primeiro contrato
          </Link>
        </Button>
      </EstadoVazio>
    );
  }
  return <ListaContratos contratos={contratos} hoje={hojeISO()} />;
}
