"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AvisoErro, CampoAreaTexto, CampoMoeda, CampoTexto } from "@/components/campos/campos";
import { useEnviar } from "@/components/campos/use-enviar";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { criarApartamento, editarApartamento } from "../acoes";
import { type DadosApartamento, esquemaApartamento } from "../esquemas";

const somenteNumeros = (v: string) => v.replace(/\D/g, "");

export const APARTAMENTO_VAZIO: DadosApartamento = {
  identificacao: "",
  andar: "",
  bloco: "",
  valorReferencia: 0,
  quartos: "",
  areaM2: "",
  descricao: "",
  observacoes: "",
};

/** Cadastro e edição usam o mesmo formulário; com `id` é edição. */
export function FormApartamento({ id, inicial = APARTAMENTO_VAZIO }: { id?: string; inicial?: DadosApartamento }) {
  const form = useForm<DadosApartamento>({ resolver: zodResolver(esquemaApartamento), defaultValues: inicial });
  // Se der certo, a action redireciona para a página do apto; o aviso só aparece em caso de erro.
  const acao = (dados: DadosApartamento) => (id ? editarApartamento(id, dados) : criarApartamento(dados));
  const { enviar, pendente, erro } = useEnviar(form, acao, "Apartamento salvo.");

  return (
    <form onSubmit={enviar} noValidate className="@container max-w-3xl">
      <FieldGroup className="grid gap-5 @lg:grid-cols-6">
        <CampoTexto
          control={form.control}
          name="identificacao"
          rotulo="Número do apartamento"
          placeholder="Ex.: 203"
          autoFocus={!id}
          className="@lg:col-span-2"
        />
        <CampoTexto
          control={form.control}
          name="andar"
          rotulo="Andar"
          inputMode="numeric"
          mascara={somenteNumeros}
          descricao="Térreo = 0"
          className="@lg:col-span-2"
        />
        <CampoTexto control={form.control} name="bloco" rotulo="Bloco" opcional className="@lg:col-span-2" />

        <CampoMoeda
          control={form.control}
          name="valorReferencia"
          rotulo="Aluguel de referência"
          descricao="Sugerido ao fazer um contrato novo."
          className="@lg:col-span-2"
        />
        <CampoTexto
          control={form.control}
          name="quartos"
          rotulo="Quartos"
          opcional
          inputMode="numeric"
          mascara={somenteNumeros}
          className="@lg:col-span-2"
        />
        <CampoTexto
          control={form.control}
          name="areaM2"
          rotulo="Área (m²)"
          opcional
          inputMode="numeric"
          mascara={somenteNumeros}
          className="@lg:col-span-2"
        />

        <CampoAreaTexto
          control={form.control}
          name="descricao"
          rotulo="Descrição"
          opcional
          placeholder="Ex.: sala, cozinha americana, varanda com vista para a rua"
          className="@lg:col-span-6"
        />
        <CampoAreaTexto
          control={form.control}
          name="observacoes"
          rotulo="Observações internas"
          opcional
          descricao="Só você vê. Ex.: troca do chuveiro em 2025, medidor de água separado."
          className="@lg:col-span-6"
        />
      </FieldGroup>

      <AvisoErro mensagem={erro} />
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={id ? `/apartamentos/${id}` : "/apartamentos"}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={pendente}>
          {pendente ? "Salvando…" : id ? "Salvar alterações" : "Cadastrar apartamento"}
        </Button>
      </div>
    </form>
  );
}
