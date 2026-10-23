import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Bloco, Dados, VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { mascararTelefone } from "@/lib/mascaras";
import { vocabularioDaConta } from "@/modulos/apartamentos/consultas";
import { GaleriaFotos } from "@/modulos/arquivos/componentes/galeria-fotos";
import { BotaoLigar, BotaoWhatsApp } from "@/modulos/inquilinos/componentes/botoes-contato";
import { AcoesOrdem } from "@/modulos/manutencoes/componentes/acoes-ordem";
import { ondeE, SeloPrioridade, SeloStatusOS } from "@/modulos/manutencoes/componentes/pecas";
import { obterOrdem, prestadoresAtivos } from "@/modulos/manutencoes/consultas";
import { abertaHa, emAberto, numeroOS, ofereceVoltarStatus } from "@/modulos/manutencoes/regras";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Ordem de serviço" };

export default function PaginaOrdem({ params }: PageProps<"/manutencoes/[id]">) {
  return (
    <>
      <VoltarPara href="/manutencoes" rotulo="Manutenções" />
      <Suspense fallback={<EsqueletoBloco className="h-[32rem]" />}>
        <Conteudo params={params} />
      </Suspense>
    </>
  );
}

async function Conteudo({ params }: { params: PageProps<"/manutencoes/[id]">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const [os, v, prestadores] = await Promise.all([obterOrdem(ctx, id), vocabularioDaConta(ctx), prestadoresAtivos(ctx)]);
  if (!os) notFound();

  const aberta = emAberto(os.status);
  const onde = ondeE(v, os.apartamento);
  // Prestador que saiu da lista continua aparecendo para quem edita esta OS.
  const escolhas = os.prestador && !prestadores.some((p) => p.id === os.prestador!.id) ? [...prestadores, os.prestador] : prestadores;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-sm text-muted-foreground tabular-nums">{numeroOS(os.numero)}</p>
          <h1 className="font-heading text-[1.85rem] leading-tight text-balance lg:text-[2.25rem]">{os.titulo}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <SeloStatusOS status={os.status} />
            {aberta && <SeloPrioridade prioridade={os.prioridade} sempre />}
            <span className="text-muted-foreground">
              {os.apartamento ? (
                <Link href={`/apartamentos/${os.apartamento.id}`} className="underline-offset-4 hover:underline">
                  {onde}
                </Link>
              ) : (
                onde
              )}
              {aberta && ` · ${abertaHa(os.abertaEm, os.hoje)}`}
            </span>
          </div>
        </div>
        <AcoesOrdem
          os={{ ...os, prestadorId: os.prestador?.id ?? null }}
          imovel={os.apartamento ? v.nomeMinusculo(os.apartamento.identificacao) : null}
          voltar={ofereceVoltarStatus(os, os.apartamento?.status ?? null, os.outrasAbertas)}
          prestadores={escolhas}
          hoje={os.hoje}
        />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Detalhes">
          <Dados
            itens={[
              ["Onde", onde],
              ["Aberta em", formatarData(os.abertaEm)],
              ["Custo estimado", os.custoEstimado ? formatarMoeda(os.custoEstimado) : null],
              ["Concluída em", os.concluidaEm ? formatarData(os.concluidaEm) : null],
              ["Custo final", os.status === "CONCLUIDA" ? (os.custoFinal ? formatarMoeda(os.custoFinal) : "Sem custo") : null],
              [
                "Despesa",
                os.despesa && (
                  <Link
                    key="d"
                    href={`/financeiro?mes=${os.despesa.data.slice(0, 7)}&aba=despesas`}
                    className="underline-offset-4 hover:underline"
                  >
                    Lançada no Financeiro em {formatarData(os.despesa.data)}
                  </Link>
                ),
              ],
            ]}
          />
        </Bloco>

        <Bloco
          titulo="Prestador"
          acoes={
            os.prestador && (
              <div className="flex gap-2">
                <BotaoWhatsApp telefone={os.prestador.telefone} nome={os.prestador.nome} aceita compacto />
                <BotaoLigar telefone={os.prestador.telefone} nome={os.prestador.nome} />
              </div>
            )
          }
        >
          {os.prestador ? (
            <Dados
              itens={[
                ["Nome", os.prestador.nome],
                ["O que faz", os.prestador.especialidade],
                ["Celular", os.prestador.telefone ? mascararTelefone(os.prestador.telefone) : null],
                ["Chave PIX", os.prestador.chavePix],
                ["Observações", os.prestador.observacoes],
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ninguém escolhido ainda. Em Editar, escolha um dos{" "}
              <Link href="/manutencoes/prestadores" className="text-primary underline-offset-4 hover:underline">
                prestadores
              </Link>
              .
            </p>
          )}
        </Bloco>

        {(os.descricao || os.solucao) && (
          <Bloco titulo="O que aconteceu" className="lg:col-span-2">
            <div className="flex flex-col gap-3">
              {os.descricao && <p className="whitespace-pre-line">{os.descricao}</p>}
              {os.solucao && (
                <p className="whitespace-pre-line">
                  <strong>{os.status === "CANCELADA" ? "Cancelada: " : "Feito: "}</strong>
                  {os.solucao}
                </p>
              )}
            </div>
          </Bloco>
        )}

        <Bloco titulo="Fotos" className="lg:col-span-2">
          <p className="mb-3 text-sm text-muted-foreground">O antes e o depois: ajudam a conferir o serviço e a combinar com o prestador.</p>
          <GaleriaFotos destino={{ categoria: "FOTO_OS", ordemServicoId: os.id }} nome={numeroOS(os.numero)} fotos={os.arquivos} />
        </Bloco>
      </div>
    </>
  );
}
