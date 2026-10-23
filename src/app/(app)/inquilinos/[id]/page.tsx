import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Archive, ChevronRight, FileSignature, Pencil, ShieldCheck } from "lucide-react";
import { Bloco, Dados, VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { Avatar } from "@/components/layout/menu-usuario";
import { Button } from "@/components/ui/button";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { mascararCPF, mascararTelefone } from "@/lib/mascaras";
import { AcoesInquilino } from "@/modulos/inquilinos/componentes/acoes-inquilino";
import { BotaoLigar, BotaoWhatsApp } from "@/modulos/inquilinos/componentes/botoes-contato";
import { ListaDocumentos } from "@/modulos/arquivos/componentes/lista-documentos";
import { obterInquilino } from "@/modulos/inquilinos/consultas";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Inquilino" };

export default function PaginaInquilino({ params }: PageProps<"/inquilinos/[id]">) {
  return (
    <>
      <VoltarPara href="/inquilinos" rotulo="Inquilinos" />
      <Suspense fallback={<EsqueletoBloco className="h-[32rem]" />}>
        <Conteudo params={params} />
      </Suspense>
    </>
  );
}

const telefone = (t: string | null) => (t ? mascararTelefone(t) : null);

async function Conteudo({ params }: { params: PageProps<"/inquilinos/[id]">["params"] }) {
  const { id } = await params;
  const ctx = await exigirContexto();
  const inq = await obterInquilino(ctx, id);
  if (!inq) notFound();

  const fiador = inq.fiadores[0];
  const arquivado = inq.arquivadoEm !== null;
  const apagado = inq.dadosApagadosEm !== null;
  const morandoAgora = inq.contratos.some((c) => c.status === "ATIVO");
  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar nome={inq.nome} className="size-14 text-lg" />
          <div className="min-w-0">
            <h1 className="font-heading text-[1.85rem] leading-tight text-balance lg:text-[2.25rem]">{inq.nome}</h1>
            {inq.profissao && <p className="text-muted-foreground">{inq.profissao}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <BotaoWhatsApp telefone={inq.telefone} nome={inq.nome} aceita={inq.aceitaWhatsapp} />
          <BotaoLigar telefone={inq.telefone} nome={inq.nome} />
          {!arquivado && (
            <Button asChild variant="outline">
              <Link href={`/inquilinos/${inq.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
          )}
          <AcoesInquilino id={inq.id} nome={inq.nome} arquivado={arquivado} apagado={apagado} morandoAgora={morandoAgora} />
        </div>
      </header>

      {apagado ? (
        <Aviso icone={ShieldCheck}>
          Dados pessoais apagados em {formatarData(inq.dadosApagadosEm!)}, a pedido (LGPD).
          {inq.guardarNomeAte &&
            ` Nome e CPF ficam até ${formatarData(inq.guardarNomeAte)} por causa dos recibos e do imposto de renda; depois saem sozinhos.`}
        </Aviso>
      ) : (
        arquivado && (
          <Aviso icone={Archive}>
            Arquivado em {formatarData(inq.arquivadoEm!)}: não aparece na lista de inquilinos. Os dados continuam guardados; pelo
            menu dá para trazer de volta, baixar os dados ou apagá-los.
          </Aviso>
        )
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Dados e contato">
          <Dados
            itens={[
              ["Celular", telefone(inq.telefone)],
              ["E-mail", inq.email],
              ["CPF", inq.cpf ? mascararCPF(inq.cpf) : null],
              ["RG", inq.rg],
              ["Nascimento", inq.dataNascimento ? formatarData(inq.dataNascimento) : null],
              ["Renda mensal", inq.rendaMensal ? formatarMoeda(inq.rendaMensal) : null],
              ["Avisos pelo WhatsApp", inq.aceitaWhatsapp ? "Aceita" : "Não aceita"],
            ]}
          />
        </Bloco>

        <Bloco
          titulo="Contratos"
          acoes={
            !arquivado && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/contratos/novo?inquilino=${inq.id}`}>
                  <FileSignature className="size-4" />
                  Novo contrato
                </Link>
              </Button>
            )
          }
        >
          {inq.contratos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não aluga nenhum apartamento.</p>
          ) : (
            <ul className="divide-y">
              {inq.contratos.map((c) => (
                <li key={c.id}>
                  <Link href={`/contratos/${c.id}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="w-12 shrink-0 font-mono text-lg font-bold tabular-nums">{c.apartamento.identificacao}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={c.status === "ATIVO" ? "font-medium text-livre" : "text-muted-foreground"}>
                        {c.status === "ATIVO" ? "Mora aqui" : "Morou"}
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

        <Bloco titulo="Contato de emergência">
          <Dados
            itens={[
              ["Nome", inq.contatoEmergenciaNome],
              ["Telefone", telefone(inq.contatoEmergenciaTelefone)],
              ["Parentesco", inq.contatoEmergenciaParentesco],
            ]}
          />
        </Bloco>

        <Bloco titulo="Fiador">
          {fiador ? (
            <Dados
              itens={[
                ["Nome", fiador.nome],
                ["CPF", fiador.cpf ? mascararCPF(fiador.cpf) : null],
                ["Telefone", telefone(fiador.telefone)],
                ["E-mail", fiador.email],
                ["Endereço", fiador.endereco],
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Sem fiador cadastrado.</p>
          )}
        </Bloco>

        {!apagado && (
          <Bloco titulo="Documentos" className="lg:col-span-2">
            <ListaDocumentos
              destino={{ categoria: "DOCUMENTO", inquilinoId: inq.id }}
              documentos={inq.arquivos}
              vazio="Nenhum documento ainda. Dá para tirar foto do RG ou anexar um PDF."
            />
          </Bloco>
        )}

        {inq.observacoes && (
          <Bloco titulo="Observações" className="lg:col-span-2">
            <p className="whitespace-pre-line">{inq.observacoes}</p>
          </Bloco>
        )}
      </div>
    </>
  );
}

function Aviso({ icone: Icone, children }: { icone: typeof Archive; children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-start gap-3 rounded-2xl border bg-muted/60 p-4 text-sm">
      <Icone className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
