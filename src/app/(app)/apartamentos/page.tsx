import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Upload } from "lucide-react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { Fachada } from "@/components/comum/fachada";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GeradorLote } from "@/modulos/apartamentos/componentes/gerador-lote";
import { PainelApartamentos } from "@/modulos/apartamentos/componentes/painel-apartamentos";
import { listarApartamentos, propriedadePrincipal } from "@/modulos/apartamentos/consultas";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Imóveis" };

// O título ("Apartamentos" ou "Casas") depende do residencial, por isso vem junto com os dados.
export default function PaginaApartamentos() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  const ctx = await exigirContexto();
  const [aptos, propriedade] = await Promise.all([listarApartamentos(ctx), propriedadePrincipal(ctx)]);
  const tipo = propriedade?.tipo ?? "EDIFICIO";
  const v = vocabulario(tipo);

  return (
    <>
      <CabecalhoPagina
        titulo={v.Plural}
        descricao={`Toque ${v.num} ${v.singular} para ver os detalhes, as fotos e o histórico.`}
        acoes={
          <Button asChild>
            <Link href="/apartamentos/novo">
              <Plus className="size-4" />
              {v.novo} {v.singular}
            </Link>
          </Button>
        }
      />
      {aptos.length === 0 ? (
        <PrimeiroCadastro tipo={tipo} />
      ) : (
        <PainelApartamentos aptos={aptos} residencial={propriedade?.nome ?? "Residencial"} tipo={tipo} />
      )}
    </>
  );
}

/** Primeiro uso: o gerador já aberto na tela, que é o jeito mais rápido de montar o residencial. */
function PrimeiroCadastro({ tipo }: { tipo: TipoResidencial }) {
  const v = vocabulario(tipo);
  return (
    <section className="grid gap-8 rounded-3xl border bg-card p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <div>
        <h2 className="font-heading text-2xl">Monte o residencial</h2>
        <p className="mt-2 mb-6 max-w-lg text-muted-foreground">
          {tipo === "CASAS"
            ? "Diga quantas casas são. Os números saem prontos (Casa 01, 02, 03…), e depois você ajusta o que for diferente."
            : "Diga quantos andares e quantos apartamentos por andar. Os números saem prontos, e depois você ajusta o que for diferente."}
        </p>
        <GeradorLote tipo={tipo} />
      </div>
      <aside className="flex flex-col gap-4 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        {tipo === "EDIFICIO" && <Fachada apagada className="hidden w-40 lg:block" />}
        <p className="text-sm text-muted-foreground">Não segue um padrão?</p>
        <Button asChild variant="outline">
          <Link href="/apartamentos/novo">
            <Plus className="size-4" />
            Cadastrar {v.um} por {v.um}
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/importar">
            <Upload className="size-4" />
            Importar planilha
          </Link>
        </Button>
      </aside>
    </section>
  );
}

function Carregando() {
  return (
    <>
      <div className="mb-6 lg:mb-8">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      </div>
      <EsqueletoBloco className="h-[30rem]" />
    </>
  );
}
