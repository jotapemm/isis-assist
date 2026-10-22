import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Upload } from "lucide-react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { Fachada } from "@/components/comum/fachada";
import { Button } from "@/components/ui/button";
import { GeradorLote } from "@/modulos/apartamentos/componentes/gerador-lote";
import { PainelApartamentos } from "@/modulos/apartamentos/componentes/painel-apartamentos";
import { listarApartamentos, propriedadePrincipal } from "@/modulos/apartamentos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Apartamentos" };

export default function PaginaApartamentos() {
  return (
    <>
      <CabecalhoPagina
        titulo="Apartamentos"
        descricao="Toque num apartamento para ver os detalhes, as fotos e o histórico."
        acoes={
          <Button asChild>
            <Link href="/apartamentos/novo">
              <Plus className="size-4" />
              Novo apartamento
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<EsqueletoBloco className="h-[30rem]" />}>
        <Conteudo />
      </Suspense>
    </>
  );
}

async function Conteudo() {
  const ctx = await exigirContexto();
  const [aptos, propriedade] = await Promise.all([listarApartamentos(ctx), propriedadePrincipal(ctx)]);

  if (aptos.length === 0) return <PrimeiroCadastro />;
  return <PainelApartamentos aptos={aptos} residencial={propriedade?.nome ?? "Residencial"} />;
}

/** Primeiro uso: o gerador já aberto na tela, que é o jeito mais rápido de montar o prédio. */
function PrimeiroCadastro() {
  return (
    <section className="grid gap-8 rounded-3xl border bg-card p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_14rem]">
      <div>
        <h2 className="font-heading text-2xl">Monte o residencial</h2>
        <p className="mt-2 mb-6 max-w-lg text-muted-foreground">
          Diga quantos andares e quantos apartamentos por andar. Os números saem prontos, e depois você ajusta o que for diferente.
        </p>
        <GeradorLote />
      </div>
      <aside className="flex flex-col gap-4 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        <Fachada apagada className="hidden w-40 lg:block" />
        <p className="text-sm text-muted-foreground">O prédio não segue um padrão?</p>
        <Button asChild variant="outline">
          <Link href="/apartamentos/novo">
            <Plus className="size-4" />
            Cadastrar um por um
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
