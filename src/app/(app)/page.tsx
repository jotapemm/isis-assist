import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertCircle, ArrowRight, Bell, Building2, CalendarClock, ChevronRight, TrendingUp, Upload, Wrench } from "lucide-react";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Fachada } from "@/components/comum/fachada";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { distanciaEmDias } from "@/lib/datas";
import { formatarData, formatarMoeda, FUSO, saudacao } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { MapaResidencial } from "@/modulos/apartamentos/componentes/mapa-vila";
import { listarApartamentos } from "@/modulos/apartamentos/consultas";
import { STATUS, STATUS_APARTAMENTO } from "@/modulos/apartamentos/status";
import { type Vocabulario, vocabulario } from "@/modulos/apartamentos/vocabulario";
import { obterResumoConta } from "@/modulos/conta/consultas";
import { avisosDeContratos } from "@/modulos/contratos/consultas";
import { atrasosParaPainel } from "@/modulos/financeiro/consultas";
import { lembretesParaPainel } from "@/modulos/lembretes/consultas";
import { avisosDeManutencao } from "@/modulos/manutencoes/consultas";
import { EvolucaoDoAno, NumerosDoMes } from "@/modulos/relatorios/componentes/numeros-do-painel";
import { numerosDoPainel } from "@/modulos/relatorios/consultas";
import { abertaHa, numeroOS, PRIORIDADE } from "@/modulos/manutencoes/regras";
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
  const [{ propriedade }, aptos, avisos, atrasos, consertos, lembretes, numeros] = await Promise.all([
    obterResumoConta(ctx),
    listarApartamentos(ctx),
    avisosDeContratos(ctx),
    atrasosParaPainel(ctx),
    avisosDeManutencao(ctx),
    lembretesParaPainel(ctx),
    numerosDoPainel(ctx),
  ]);
  const agora = new Date();
  const hoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(agora);
  const residencial = propriedade?.nome ?? "Residencial";
  const tipo = propriedade?.tipo ?? "EDIFICIO";
  const v = vocabulario(tipo);

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
          titulo={`${v.nenhum} ${v.singular} ${v.cadastrado}`}
          descricao={`Cadastre ${v.o}s ${v.plural} ou importe a planilha que você já usa. ${v.cadaUm[0].toUpperCase()}${v.cadaUm.slice(1)} aparece aqui no mapa, com a cor do status.`}
        >
          <Button asChild size="lg">
            <Link href="/apartamentos">
              <Building2 className="size-5" />
              Cadastrar {v.plural}
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
          <NumerosDoMes n={numeros} />
          <Avisos avisos={avisos} atrasos={atrasos} consertos={consertos} lembretes={lembretes} v={v} />
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
                  de <span className="tabular-nums">{aptos.length}</span> {v.plural} {v.ocupados}
                </p>
              </div>
              <Button asChild variant="ghost" className="self-start sm:self-auto">
                <Link href="/apartamentos">
                  Ver {v.plural}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </header>

            <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label={`${v.Plural} por status`}>
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

            <MapaResidencial tipo={tipo} aptos={aptos} residencial={residencial} />
          </section>
          <EvolucaoDoAno n={numeros} />
        </>
      )}
    </>
  );
}

/** Atrasos, consertos urgentes, reajustes chegando e contratos terminando — some quando não há nada para olhar. */
function Avisos({
  avisos,
  atrasos,
  consertos,
  lembretes,
  v,
}: {
  avisos: Awaited<ReturnType<typeof avisosDeContratos>>;
  atrasos: Awaited<ReturnType<typeof atrasosParaPainel>>;
  consertos: Awaited<ReturnType<typeof avisosDeManutencao>>;
  lembretes: Awaited<ReturnType<typeof lembretesParaPainel>>;
  v: Vocabulario;
}) {
  const itens = [
    ...(atrasos.quantidade > 0
      ? [
          {
            id: "atrasos",
            href: "/financeiro",
            icone: AlertCircle,
            texto: `${atrasos.quantidade} ${atrasos.quantidade === 1 ? "aluguel" : "aluguéis"} em atraso`,
            quando: `somando ${formatarMoeda(atrasos.total)}`,
          },
        ]
      : []),
    ...lembretes.map((l) => ({
      id: `l-${l.id}`,
      href: "/lembretes",
      icone: Bell,
      texto: `${l.titulo}${l.apartamento ? ` (${v.nomeMinusculo(l.apartamento.identificacao)})` : ""}`,
      quando: l.data === avisos.hoje ? (l.hora ? `hoje às ${l.hora}` : "hoje") : `desde ${formatarData(l.data!)}`,
    })),
    ...consertos.map((os) => ({
      id: `os-${os.id}`,
      href: `/manutencoes/${os.id}`,
      icone: Wrench,
      texto: `${PRIORIDADE[os.prioridade].rotulo}: ${os.titulo} (${os.apartamento ? v.nomeMinusculo(os.apartamento.identificacao) : "área comum"}, ${numeroOS(os.numero)})`,
      quando: abertaHa(os.abertaEm, avisos.hoje),
    })),
    ...avisos.reajustes.map((c) => ({
      id: `r-${c.id}`,
      href: `/contratos/${c.id}`,
      icone: TrendingUp,
      texto: `Reajuste ${v.do} ${v.nomeMinusculo(c.apartamento.identificacao)} (${c.inquilino.nome.split(" ")[0]})`,
      quando:
        c.diasParaReajuste! < 0
          ? `atrasado desde ${formatarData(c.proximoReajusteEm!)}`
          : distanciaEmDias(avisos.hoje, c.proximoReajusteEm!),
    })),
    ...avisos.terminando.map((c) => ({
      id: `t-${c.id}`,
      href: `/contratos/${c.id}`,
      icone: CalendarClock,
      texto: `Contrato ${v.do} ${v.nomeMinusculo(c.apartamento.identificacao)} (${c.inquilino.nome.split(" ")[0]}) termina`,
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
