import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Building2, CalendarClock, ChevronRight, TrendingUp, Upload } from "lucide-react";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Fachada } from "@/components/comum/fachada";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { distanciaEmDias } from "@/lib/datas";
import { formatarData, FUSO, saudacao } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { MapaFachada } from "@/modulos/apartamentos/componentes/mapa-fachada";
import { listarApartamentos } from "@/modulos/apartamentos/consultas";
import { STATUS, STATUS_APARTAMENTO } from "@/modulos/apartamentos/status";
import { obterResumoConta } from "@/modulos/conta/consultas";
import { avisosDeContratos } from "@/modulos/contratos/consultas";
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
  const [{ propriedade }, aptos, avisos] = await Promise.all([
    obterResumoConta(ctx),
    listarApartamentos(ctx),
    avisosDeContratos(ctx),
  ]);
  const agora = new Date();
  const hoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(agora);
  const residencial = propriedade?.nome ?? "Residencial";

  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">{hoje}</p>
        <h1 className="mt-1 font-heading text-[2rem] leading-tight lg:text-[2.6rem]">
          {saudacao(agora)}, {ctx.usuario.nome.split(" ")[0]}
        </h1>
        {propriedade && <p className="mt-1 text-muted-foreground">{propriedade.nome}</p>}
      </header>

      {aptos.length === 0 ? (
        <EstadoVazio
          ilustracao={<Fachada apagada className="mb-6 w-44 sm:w-52" />}
          titulo="Nenhum apartamento cadastrado"
          descricao="Cadastre os apartamentos ou importe a planilha que você já usa. Cada um aparece aqui na fachada, com a cor do status."
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
      ) : (
        <>
          <Avisos avisos={avisos} />
          <section aria-labelledby="titulo-fachada" className="rounded-3xl border bg-card p-3 sm:p-6">
            <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="titulo-fachada" className="font-heading text-xl">
                  Ocupação
                </h2>
                <p className="mt-1 text-muted-foreground">
                  <strong className="text-foreground tabular-nums">
                    {aptos.filter((a) => a.status === "OCUPADO").length}
                  </strong>{" "}
                  de <span className="tabular-nums">{aptos.length}</span> apartamentos ocupados
                </p>
              </div>
              <Button asChild variant="ghost" className="self-start sm:self-auto">
                <Link href="/apartamentos">
                  Ver apartamentos
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </header>

            <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Apartamentos por status">
              {STATUS_APARTAMENTO.map((s) => {
                const quantos = aptos.filter((a) => a.status === s).length;
                if (quantos === 0) return null;
                return (
                  <li key={s} className="flex items-center gap-2">
                    <span className={cn("size-2.5 rounded-full", STATUS[s].ponto)} aria-hidden="true" />
                    {STATUS[s].rotulo}
                    <strong className="tabular-nums">{quantos}</strong>
                  </li>
                );
              })}
            </ul>

            <MapaFachada aptos={aptos} residencial={residencial} />
          </section>
        </>
      )}
    </>
  );
}

/** Reajustes chegando e contratos terminando — some quando não há nada para olhar. */
function Avisos({ avisos }: { avisos: Awaited<ReturnType<typeof avisosDeContratos>> }) {
  const itens = [
    ...avisos.reajustes.map((c) => ({
      id: `r-${c.id}`,
      href: `/contratos/${c.id}`,
      icone: TrendingUp,
      texto: `Reajuste do apto ${c.apartamento.identificacao} (${c.inquilino.nome.split(" ")[0]})`,
      quando:
        c.diasParaReajuste! < 0
          ? `atrasado desde ${formatarData(c.proximoReajusteEm!)}`
          : distanciaEmDias(avisos.hoje, c.proximoReajusteEm!),
    })),
    ...avisos.terminando.map((c) => ({
      id: `t-${c.id}`,
      href: `/contratos/${c.id}`,
      icone: CalendarClock,
      texto: `Contrato do apto ${c.apartamento.identificacao} (${c.inquilino.nome.split(" ")[0]}) termina`,
      quando: c.diasParaFim! < 0 ? `terminou em ${formatarData(c.dataFim)}` : distanciaEmDias(avisos.hoje, c.dataFim),
    })),
  ];
  if (itens.length === 0) return null;

  return (
    <section aria-labelledby="titulo-avisos" className="mb-4 rounded-3xl border bg-card p-3 sm:p-6">
      <h2 id="titulo-avisos" className="mb-3 font-heading text-xl">
        Para ficar de olho
      </h2>
      <ul className="divide-y">
        {itens.map(({ id, href, icone: Icone, texto, quando }) => (
          <li key={id}>
            <Link href={href} className="flex items-center gap-3 py-2.5 hover:text-primary">
              <Icone className="size-5 shrink-0 text-reservado" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                {texto} <span className="text-muted-foreground">{quando}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
