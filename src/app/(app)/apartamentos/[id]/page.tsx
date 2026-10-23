import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FileSignature } from "lucide-react";
import { Bloco, Dados, VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { AcoesApartamento } from "@/modulos/apartamentos/componentes/acoes-apartamento";
import { GaleriaFotos } from "@/modulos/apartamentos/componentes/galeria-fotos";
import { HistoricoStatus } from "@/modulos/apartamentos/componentes/historico-status";
import { MudarStatus } from "@/modulos/apartamentos/componentes/mudar-status";
import { obterApartamento, vocabularioDaConta } from "@/modulos/apartamentos/consultas";
import { nomeAndar } from "@/modulos/apartamentos/status";
import { BotaoWhatsApp } from "@/modulos/inquilinos/componentes/botoes-contato";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Imóvel" };

export default function PaginaApartamento({ params }: PageProps<"/apartamentos/[id]">) {
  return (
    <>
      <Suspense fallback={<EsqueletoBloco className="h-[32rem]" />}>
        <Conteudo params={params} />
      </Suspense>
    </>
  );
}

async function Conteudo({ params }: { params: PageProps<"/apartamentos/[id]">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const [apto, v] = await Promise.all([obterApartamento(ctx, id), vocabularioDaConta(ctx)]);
  if (!apto) notFound();

  const contratoAtivo = apto.contratos.find((c) => c.status === "ATIVO");
  const subtitulo = [
    v.tipo === "EDIFICIO" && nomeAndar(apto.andar),
    apto.bloco && (v.tipo === "CASAS" ? apto.bloco : `Bloco ${apto.bloco}`),
    apto.valorReferencia !== null && `${formatarMoeda(apto.valorReferencia)} de referência`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <VoltarPara href="/apartamentos" rotulo={v.Plural} />
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[2rem] leading-tight lg:text-[2.5rem]">
            {v.curto} <span className="font-mono font-bold tracking-tight">{apto.identificacao}</span>
          </h1>
          <p className="text-muted-foreground">{subtitulo}</p>
          <div className="mt-1">
            <MudarStatus apartamentoId={apto.id} identificacao={apto.identificacao} tipo={v.tipo} atual={apto.status} />
          </div>
        </div>
        <AcoesApartamento id={apto.id} identificacao={apto.identificacao} tipo={v.tipo} />
      </header>

      <Tabs defaultValue="resumo">
        <TabsList className="mb-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="inquilinos">Inquilinos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="grid gap-4 lg:grid-cols-2">
          <Bloco
            titulo="Inquilino atual"
            acoes={contratoAtivo && <BotaoWhatsApp telefone={contratoAtivo.inquilino.telefone} nome={contratoAtivo.inquilino.nome} compacto />}
          >
            {contratoAtivo ? (
              <div className="flex flex-col gap-3">
                <div>
                  <Link href={`/inquilinos/${contratoAtivo.inquilino.id}`} className="text-lg font-medium underline-offset-4 hover:underline">
                    {contratoAtivo.inquilino.nome}
                  </Link>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatarMoeda(contratoAtivo.valorAluguel)} · vence dia {contratoAtivo.diaVencimento} · até{" "}
                    {formatarData(contratoAtivo.dataFim)}
                  </p>
                </div>
                <Button asChild variant="outline" className="self-start">
                  <Link href={`/contratos/${contratoAtivo.id}`}>
                    <FileSignature className="size-4" />
                    Ver contrato
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">Sem contrato ativo.</p>
                <Button asChild className="self-start">
                  <Link href={`/contratos/novo?apartamento=${apto.id}`}>
                    <FileSignature className="size-4" />
                    Alugar {v.este} {v.singular}
                  </Link>
                </Button>
              </div>
            )}
          </Bloco>

          <Bloco titulo="Dados">
            <Dados
              itens={[
                ["Quartos", apto.quartos],
                ["Área", apto.areaM2 !== null ? `${apto.areaM2} m²` : null],
                ["Aluguel de referência", apto.valorReferencia !== null ? formatarMoeda(apto.valorReferencia) : null],
                ["Descrição", apto.descricao],
                ["Observações internas", apto.observacoes],
              ]}
            />
          </Bloco>

          <Bloco titulo="Fotos" className="lg:col-span-2">
            <GaleriaFotos apartamentoId={apto.id} nome={v.nome(apto.identificacao)} fotos={apto.arquivos} />
          </Bloco>
        </TabsContent>

        <TabsContent value="inquilinos">
          <Bloco titulo="Quem morou aqui">
            {apto.contratos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contrato ainda.</p>
            ) : (
              <ul className="divide-y">
                {apto.contratos.map((c) => (
                  <li key={c.id}>
                    <Link href={`/contratos/${c.id}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium">
                          {c.inquilino.nome}
                          {c.status === "ATIVO" && <span className="ml-2 text-sm font-normal text-livre">mora aqui</span>}
                        </span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {formatarData(c.dataInicio)} a {formatarData(c.encerradoEm ?? c.dataFim)} · {formatarMoeda(c.valorAluguel)}
                        </span>
                      </span>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Bloco>
        </TabsContent>

        <TabsContent value="historico">
          <Bloco titulo="Mudanças de status">
            <HistoricoStatus itens={apto.historicoStatus} />
          </Bloco>
        </TabsContent>
      </Tabs>
    </>
  );
}
