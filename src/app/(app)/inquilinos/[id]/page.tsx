import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FileSignature, Pencil } from "lucide-react";
import { Bloco, Dados, VoltarPara } from "@/components/comum/blocos";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { Avatar } from "@/components/layout/menu-usuario";
import { Button } from "@/components/ui/button";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { mascararCPF, mascararTelefone } from "@/lib/mascaras";
import { AcoesInquilino } from "@/modulos/inquilinos/componentes/acoes-inquilino";
import { BotaoLigar, BotaoWhatsApp } from "@/modulos/inquilinos/componentes/botoes-contato";
import { Documentos } from "@/modulos/inquilinos/componentes/documentos";
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
          <BotaoWhatsApp telefone={inq.telefone} nome={inq.nome} />
          <BotaoLigar telefone={inq.telefone} nome={inq.nome} />
          <Button asChild variant="outline">
            <Link href={`/inquilinos/${inq.id}/editar`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </Button>
          <AcoesInquilino id={inq.id} nome={inq.nome} />
        </div>
      </header>

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

        <Bloco titulo="Contrato">
          <div className="flex items-start gap-3 text-muted-foreground">
            <FileSignature className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p className="text-sm">O apartamento e o contrato aparecem aqui quando os contratos chegarem (Fase 2).</p>
          </div>
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

        <Bloco titulo="Documentos" className="lg:col-span-2">
          <Documentos inquilinoId={inq.id} documentos={inq.arquivos} />
        </Bloco>

        {inq.observacoes && (
          <Bloco titulo="Observações" className="lg:col-span-2">
            <p className="whitespace-pre-line">{inq.observacoes}</p>
          </Bloco>
        )}
      </div>
    </>
  );
}
