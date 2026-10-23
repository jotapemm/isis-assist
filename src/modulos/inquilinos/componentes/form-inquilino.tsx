"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AvisoErro,
  CampoAreaTexto,
  CampoData,
  CampoInterruptor,
  CampoMoeda,
  CampoTexto,
} from "@/components/campos/campos";
import { useEnviar } from "@/components/campos/use-enviar";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { mascararCPF, mascararTelefone } from "@/lib/mascaras";
import { criarInquilino, editarInquilino } from "../acoes";
import { type DadosInquilino, esquemaInquilino, INQUILINO_VAZIO } from "../esquemas";

/** Parte do formulário com título — o cadastro é longo, então vem dividido em blocos. */
function Parte({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <fieldset className="@container flex flex-col gap-4 border-t pt-6 first:border-t-0 first:pt-0">
      <div>
        <legend className="font-heading text-lg">{titulo}</legend>
        {descricao && <p className="mt-0.5 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function FormInquilino({ id, inicial = INQUILINO_VAZIO }: { id?: string; inicial?: DadosInquilino }) {
  const form = useForm<DadosInquilino>({ resolver: zodResolver(esquemaInquilino), defaultValues: inicial });
  const acao = (dados: DadosInquilino) => (id ? editarInquilino(id, dados) : criarInquilino(dados));
  const { enviar, pendente, erro } = useEnviar(form, acao, "Inquilino salvo.");
  const temFiador = useWatch({ control: form.control, name: "temFiador" });
  const c = form.control;

  return (
    <form method="post" onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-8">
      <Parte titulo="Dados pessoais" descricao="Só o nome é obrigatório; o resto pode ser completado depois.">
        <FieldGroup className="grid gap-5 @lg:grid-cols-2">
          <CampoTexto control={c} name="nome" rotulo="Nome completo" autoComplete="off" autoCapitalize="words" autoFocus={!id} className="@lg:col-span-2" />
          <CampoTexto control={c} name="cpf" rotulo="CPF" inputMode="numeric" mascara={mascararCPF} />
          <CampoTexto control={c} name="rg" rotulo="RG" />
          <CampoData control={c} name="dataNascimento" rotulo="Data de nascimento" />
          <CampoTexto control={c} name="profissao" rotulo="Profissão" autoCapitalize="sentences" />
          <CampoMoeda control={c} name="rendaMensal" rotulo="Renda mensal" descricao="Ajuda a avaliar o valor do aluguel." />
        </FieldGroup>
      </Parte>

      <Parte titulo="Contato">
        <FieldGroup className="grid gap-5 @lg:grid-cols-2">
          <CampoTexto control={c} name="telefone" rotulo="Celular (WhatsApp)" inputMode="tel" mascara={mascararTelefone} />
          <CampoTexto control={c} name="email" rotulo="E-mail" type="email" inputMode="email" autoCapitalize="none" />
          <CampoInterruptor
            control={c}
            name="aceitaWhatsapp"
            rotulo="Aceita receber avisos pelo WhatsApp"
            descricao="Lembretes de vencimento e recibos. Pergunte ao inquilino antes de marcar."
            className="@lg:col-span-2"
          />
        </FieldGroup>
      </Parte>

      <Parte titulo="Contato de emergência" descricao="Quem chamar se algo acontecer com o inquilino.">
        <FieldGroup className="grid gap-5 @lg:grid-cols-3">
          <CampoTexto control={c} name="contatoEmergenciaNome" rotulo="Nome" autoCapitalize="words" />
          <CampoTexto control={c} name="contatoEmergenciaTelefone" rotulo="Telefone" inputMode="tel" mascara={mascararTelefone} />
          <CampoTexto control={c} name="contatoEmergenciaParentesco" rotulo="Parentesco" placeholder="Ex.: mãe, irmão" />
        </FieldGroup>
      </Parte>

      <Parte titulo="Fiador">
        <CampoInterruptor control={c} name="temFiador" rotulo="Este inquilino tem fiador" />
        {temFiador && (
          <FieldGroup className="grid gap-5 @lg:grid-cols-2">
            <CampoTexto control={c} name="fiador.nome" rotulo="Nome do fiador" autoCapitalize="words" className="@lg:col-span-2" />
            <CampoTexto control={c} name="fiador.cpf" rotulo="CPF do fiador" inputMode="numeric" mascara={mascararCPF} />
            <CampoTexto control={c} name="fiador.telefone" rotulo="Telefone do fiador" inputMode="tel" mascara={mascararTelefone} />
            <CampoTexto control={c} name="fiador.email" rotulo="E-mail do fiador" type="email" inputMode="email" autoCapitalize="none" />
            <CampoTexto control={c} name="fiador.endereco" rotulo="Endereço do fiador" />
          </FieldGroup>
        )}
      </Parte>

      <Parte titulo="Observações">
        <CampoAreaTexto control={c} name="observacoes" rotulo="Anotações sobre o inquilino" descricao="Só você vê." />
      </Parte>

      <div>
        <AvisoErro mensagem={erro} />
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="ghost">
            <Link href={id ? `/inquilinos/${id}` : "/inquilinos"}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={pendente}>
            {pendente ? "Salvando…" : id ? "Salvar alterações" : "Cadastrar inquilino"}
          </Button>
        </div>
      </div>
    </form>
  );
}
