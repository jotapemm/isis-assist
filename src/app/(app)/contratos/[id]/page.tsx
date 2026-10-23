import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronRight, Pencil } from "lucide-react";
import { Bloco, Dados, VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { Button } from "@/components/ui/button";
import { mesesEntre } from "@/lib/datas";
import { formatarData, formatarDataHora, formatarMoeda, hojeISO } from "@/lib/formatar";
import { ListaDocumentos } from "@/modulos/arquivos/componentes/lista-documentos";
import { AplicarReajuste } from "@/modulos/contratos/componentes/aplicar-reajuste";
import { EncerrarContrato } from "@/modulos/contratos/componentes/encerrar-contrato";
import { AvisosDePrazo, SeloContrato } from "@/modulos/contratos/componentes/situacao";
import { vocabularioDaConta } from "@/modulos/apartamentos/consultas";
import { obterContrato } from "@/modulos/contratos/consultas";
import { SeloSituacao } from "@/modulos/financeiro/componentes/pecas";
import { cobrancasDoContrato } from "@/modulos/financeiro/consultas";
import { mesPorExtenso } from "@/modulos/financeiro/regras";
import { AVISO_REAJUSTE_DIAS } from "@/modulos/contratos/limites";
import { INDICES, percentualTexto } from "@/modulos/contratos/reajuste";
import { BotaoWhatsApp } from "@/modulos/inquilinos/componentes/botoes-contato";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Contrato" };

export default function PaginaContrato({ params }: PageProps<"/contratos/[id]">) {
  return (
    <>
      <VoltarPara href="/contratos" rotulo="Contratos" />
      <Suspense fallback={<EsqueletoBloco className="h-[32rem]" />}>
        <Conteudo params={params} />
      </Suspense>
    </>
  );
}

async function Conteudo({ params }: { params: PageProps<"/contratos/[id]">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const [c, v, { cobrancas }] = await Promise.all([obterContrato(ctx, id), vocabularioDaConta(ctx), cobrancasDoContrato(ctx, id)]);
  if (!c) notFound();

  const hoje = hojeISO();
  const ativo = c.status === "ATIVO";
  const reajusteChegando = c.diasParaReajuste !== null && c.diasParaReajuste <= AVISO_REAJUSTE_DIAS;
  const reajuste =
    c.indiceReajuste === "NENHUM"
      ? "Sem reajuste"
      : `${c.indiceReajuste === "FIXO" ? `${percentualTexto(c.percentualFixo ?? 0)} ao ano` : INDICES[c.indiceReajuste].rotulo}` +
        (c.proximoReajusteEm ? ` · próximo em ${formatarData(c.proximoReajusteEm)}` : "");

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-[1.85rem] leading-tight lg:text-[2.25rem]">
              {v.curto} <span className="font-mono font-bold tracking-tight">{c.apartamento.identificacao}</span>
            </h1>
            <SeloContrato contrato={c} className="text-sm" />
          </div>
          <p className="text-muted-foreground">
            <Link href={`/inquilinos/${c.inquilino.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
              {c.inquilino.nome}
            </Link>{" "}
            · {formatarData(c.dataInicio)} a {formatarData(c.dataFim)} ({mesesEntre(c.dataInicio, c.dataFim)} meses)
          </p>
        </div>
        {ativo && (
          <div className="flex flex-wrap gap-2">
            {c.indiceReajuste !== "NENHUM" && <AplicarReajuste contratoId={c.id} destaque={reajusteChegando} />}
            <Button asChild variant="outline">
              <Link href={`/contratos/${c.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <EncerrarContrato
              contratoId={c.id}
              nomeImovel={v.nome(c.apartamento.identificacao)}
              tipo={v.tipo}
              nomeInquilino={c.inquilino.nome}
              valorCaucao={c.valorCaucao ?? 0}
              hoje={hoje}
            />
          </div>
        )}
      </header>

      <div className="mb-4">
        <AvisosDePrazo contrato={c} hoje={hoje} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Valores">
          <p className="font-heading text-3xl tabular-nums">{formatarMoeda(c.valorAluguel)}</p>
          <p className="mb-4 text-sm text-muted-foreground">por mês, vence todo dia {c.diaVencimento}</p>
          <Dados
            itens={[
              ["Aluguel na assinatura", c.valorInicial !== c.valorAluguel ? formatarMoeda(c.valorInicial) : null],
              ["Reajuste", reajuste],
              ["Caução", c.valorCaucao ? formatarMoeda(c.valorCaucao) : "Sem caução"],
              [
                "Caução devolvida",
                c.caucaoDevolvidaEm ? `${formatarMoeda(c.valorCaucaoDevolvido ?? 0)} em ${formatarData(c.caucaoDevolvidaEm)}` : null,
              ],
            ]}
          />
        </Bloco>

        <Bloco titulo="Pessoas" acoes={<BotaoWhatsApp telefone={c.inquilino.telefone} nome={c.inquilino.nome} compacto />}>
          <Dados
            itens={[
              ["Inquilino", <Link key="i" href={`/inquilinos/${c.inquilino.id}`} className="underline-offset-4 hover:underline">{c.inquilino.nome}</Link>],
              ["Fiador", c.fiador?.nome ?? "Sem fiador"],
              [v.Singular, <Link key="a" href={`/apartamentos/${c.apartamento.id}`} className="underline-offset-4 hover:underline">{v.nome(c.apartamento.identificacao)}</Link>],
              ["Encerrado em", c.encerradoEm ? formatarData(c.encerradoEm) : null],
              ["Motivo", c.motivoEncerramento],
            ]}
          />
        </Bloco>

        <Bloco titulo="Contrato assinado">
          <ListaDocumentos
            destino={{ categoria: "CONTRATO_PDF", contratoId: c.id }}
            documentos={c.arquivos}
            vazio="Anexe o contrato assinado (PDF ou foto das páginas) para ter sempre à mão."
            rotuloEnviar="Anexar contrato"
          />
        </Bloco>

        <Bloco titulo="Cobranças">
          {cobrancas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              A primeira cobrança aparece no mês do primeiro vencimento (todo dia {c.diaVencimento}).
            </p>
          ) : (
            <ul className="divide-y">
              {cobrancas.map((cob) => (
                <li key={cob.id}>
                  <Link
                    href={`/financeiro?mes=${cob.competencia.slice(0, 7)}&pagar=${cob.id}`}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium first-letter:uppercase">{mesPorExtenso(cob.competencia)}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        vence {formatarData(cob.vencimento)} · {formatarMoeda(cob.valor)}
                      </span>
                    </span>
                    <SeloSituacao situacao={cob.situacao} />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Bloco>

        <Bloco titulo="Reajustes" className="lg:col-span-2">
          {c.reajustes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {c.proximoReajusteEm ? `O primeiro reajuste é em ${formatarData(c.proximoReajusteEm)}.` : "Nenhum reajuste."}
            </p>
          ) : (
            <ul className="divide-y">
              {c.reajustes.map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0">
                  <span>
                    <span className="font-medium">{formatarData(r.dataBase)}</span>{" "}
                    <span className="text-muted-foreground">
                      · {INDICES[r.indice].rotulo} {percentualTexto(r.percentual)}
                      {r.observacao && ` · ${r.observacao}`}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatarMoeda(r.valorAnterior)} → <strong>{formatarMoeda(r.valorNovo)}</strong>
                  </span>
                  <span className="w-full text-xs text-muted-foreground">
                    Aplicado em {formatarDataHora(r.createdAt)}
                    {r.aplicadoPor && ` por ${r.aplicadoPor.name.split(" ")[0]}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloco>

        {c.observacoes && (
          <Bloco titulo="Observações" className="lg:col-span-2">
            <p className="whitespace-pre-line">{c.observacoes}</p>
          </Bloco>
        )}
      </div>
    </>
  );
}
