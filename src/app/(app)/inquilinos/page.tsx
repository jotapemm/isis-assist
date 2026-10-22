import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Users } from "lucide-react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Button } from "@/components/ui/button";
import { ListaInquilinos } from "@/modulos/inquilinos/componentes/lista-inquilinos";
import { listarInquilinos } from "@/modulos/inquilinos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Inquilinos" };

export default function PaginaInquilinos() {
  return (
    <>
      <CabecalhoPagina
        titulo="Inquilinos"
        descricao="Quem mora e quem já morou: contatos, fiador e documentos."
        acoes={
          <Button asChild>
            <Link href="/inquilinos/novo">
              <Plus className="size-4" />
              Novo inquilino
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
  const inquilinos = await listarInquilinos(ctx);

  if (inquilinos.length === 0) {
    return (
      <EstadoVazio
        icone={Users}
        titulo="Nenhum inquilino cadastrado"
        descricao="Cadastre quem mora em cada apartamento. Só o nome é obrigatório; CPF, contatos e documentos podem vir depois."
      >
        <Button asChild size="lg">
          <Link href="/inquilinos/novo">
            <Plus className="size-5" />
            Cadastrar inquilino
          </Link>
        </Button>
      </EstadoVazio>
    );
  }
  return <ListaInquilinos inquilinos={inquilinos} />;
}
