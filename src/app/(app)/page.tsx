import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Building2, Upload } from "lucide-react";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Fachada } from "@/components/comum/fachada";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FUSO, saudacao } from "@/lib/formatar";
import { obterResumoConta } from "@/modulos/conta/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Início" };

export default function PaginaInicio() {
  return (
    <Suspense fallback={<CarregandoPainel />}>
      <Painel />
    </Suspense>
  );
}

async function Painel() {
  const ctx = await exigirContexto();
  const { propriedade } = await obterResumoConta(ctx);
  const agora = new Date();
  const hoje = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long", day: "numeric", month: "long" }).format(agora);

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">{hoje}</p>
        <h1 className="mt-1 font-heading text-[2rem] leading-tight lg:text-[2.6rem]">
          {saudacao(agora)}, {ctx.usuario.nome.split(" ")[0]}
        </h1>
        {propriedade && <p className="mt-1 text-muted-foreground">{propriedade.nome}</p>}
      </header>

      <EstadoVazio
        ilustracao={<Fachada apagada className="mb-6 w-44 sm:w-52" />}
        titulo="Vamos montar o seu residencial"
        descricao="Cadastre os apartamentos e eles aparecem aqui, na fachada, cada um com a cor do seu status. Se você já controla tudo numa planilha, dá para trazer de lá."
      >
        <Button asChild size="lg">
          <Link href="/apartamentos">
            <Building2 className="size-5" />
            Cadastrar apartamentos
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/importar">
            <Upload className="size-5" />
            Importar planilha
          </Link>
        </Button>
      </EstadoVazio>
    </>
  );
}

function CarregandoPainel() {
  return (
    <>
      <div className="mb-8">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-3 h-10 w-64 max-w-full" />
        <Skeleton className="mt-3 h-5 w-36" />
      </div>
      <EsqueletoBloco className="h-[28rem]" />
    </>
  );
}
