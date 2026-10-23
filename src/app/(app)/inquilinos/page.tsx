import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Archive, ArrowLeft, Plus, Users } from "lucide-react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Button } from "@/components/ui/button";
import { ListaInquilinos } from "@/modulos/inquilinos/componentes/lista-inquilinos";
import { contarArquivados, listarInquilinos } from "@/modulos/inquilinos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Inquilinos" };

export default function PaginaInquilinos({ searchParams }: PageProps<"/inquilinos">) {
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
        <Conteudo busca={searchParams} />
      </Suspense>
    </>
  );
}

/** ?arquivados=1 mostra quem saiu da lista — é por ali que se atende o pedido de LGPD de um ex-inquilino. */
async function Conteudo({ busca }: { busca: PageProps<"/inquilinos">["searchParams"] }) {
  const [ctx, parametros] = await Promise.all([exigirContexto(), busca]);
  const verArquivados = parametros.arquivados === "1";
  const [inquilinos, arquivados] = await Promise.all([
    listarInquilinos(ctx, { arquivados: verArquivados }),
    verArquivados ? Promise.resolve(0) : contarArquivados(ctx),
  ]);

  if (verArquivados) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" className="self-start">
          <Link href="/inquilinos">
            <ArrowLeft className="size-4" />
            Voltar para os atuais
          </Link>
        </Button>
        <h2 className="font-heading text-xl">Arquivados</h2>
        {inquilinos.length === 0 ? (
          <p className="text-muted-foreground">Ninguém arquivado.</p>
        ) : (
          <ListaInquilinos inquilinos={inquilinos} />
        )}
      </div>
    );
  }

  const linkArquivados = arquivados > 0 && (
    <Button asChild variant="ghost" className="self-start text-muted-foreground">
      <Link href="/inquilinos?arquivados=1">
        <Archive className="size-4" />
        Arquivados ({arquivados})
      </Link>
    </Button>
  );

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
        {linkArquivados}
      </EstadoVazio>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <ListaInquilinos inquilinos={inquilinos} />
      {linkArquivados}
    </div>
  );
}
