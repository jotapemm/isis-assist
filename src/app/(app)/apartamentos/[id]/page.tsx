import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FileSignature } from "lucide-react";
import { Bloco, Dados, VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatarMoeda } from "@/lib/formatar";
import { AcoesApartamento } from "@/modulos/apartamentos/componentes/acoes-apartamento";
import { GaleriaFotos } from "@/modulos/apartamentos/componentes/galeria-fotos";
import { HistoricoStatus } from "@/modulos/apartamentos/componentes/historico-status";
import { MudarStatus } from "@/modulos/apartamentos/componentes/mudar-status";
import { obterApartamento } from "@/modulos/apartamentos/consultas";
import { nomeAndar } from "@/modulos/apartamentos/status";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Apartamento" };

export default function PaginaApartamento({ params }: PageProps<"/apartamentos/[id]">) {
  return (
    <>
      <VoltarPara href="/apartamentos" rotulo="Apartamentos" />
      <Suspense fallback={<EsqueletoBloco className="h-[32rem]" />}>
        <Conteudo params={params} />
      </Suspense>
    </>
  );
}

async function Conteudo({ params }: { params: PageProps<"/apartamentos/[id]">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const apto = await obterApartamento(ctx, id);
  if (!apto) notFound();

  const subtitulo = [
    nomeAndar(apto.andar),
    apto.bloco && `Bloco ${apto.bloco}`,
    apto.valorReferencia !== null && `${formatarMoeda(apto.valorReferencia)} de referência`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[2rem] leading-tight lg:text-[2.5rem]">
            Apto <span className="font-mono font-bold tracking-tight">{apto.identificacao}</span>
          </h1>
          <p className="text-muted-foreground">{subtitulo}</p>
          <div className="mt-1">
            <MudarStatus apartamentoId={apto.id} identificacao={apto.identificacao} atual={apto.status} />
          </div>
        </div>
        <AcoesApartamento id={apto.id} identificacao={apto.identificacao} />
      </header>

      <Tabs defaultValue="resumo">
        <TabsList className="mb-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="grid gap-4 lg:grid-cols-2">
          <Bloco titulo="Inquilino atual">
            <div className="flex items-start gap-3 text-muted-foreground">
              <FileSignature className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="text-sm">
                Sem contrato ativo. Quando os contratos chegarem (Fase 2), o inquilino e o vencimento aparecem aqui.
              </p>
            </div>
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
            <GaleriaFotos apartamentoId={apto.id} identificacao={apto.identificacao} fotos={apto.arquivos} />
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
