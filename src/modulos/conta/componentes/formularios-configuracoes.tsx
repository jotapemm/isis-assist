"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import type { z } from "zod";
import { AvisoErro, CampoPercentual, CampoSelecao, CampoSenha, CampoTexto } from "@/components/campos/campos";
import { useEnviar } from "@/components/campos/use-enviar";
import { FieldGroup } from "@/components/ui/field";
import { authClient, mensagemDeErro } from "@/lib/auth-client";
import { mascararCEP, mascararCpfCnpj, mascararTelefone, somenteDigitos } from "@/lib/mascaras";
import { esquemaTrocarSenha } from "@/modulos/acesso/esquemas";
import { salvarCobranca, salvarEndereco, salvarLocador } from "../acoes";
import {
  type DadosCobranca,
  type DadosEndereco,
  type DadosLocador,
  esquemaCobranca,
  esquemaEndereco,
  esquemaLocador,
  UFS,
} from "../esquemas";
import { Secao } from "./secao";

export function FormLocador({ inicial }: { inicial: DadosLocador }) {
  const form = useForm<DadosLocador>({ resolver: zodResolver(esquemaLocador), defaultValues: inicial });
  const { enviar, pendente, erro } = useEnviar(form, salvarLocador, "Dados do recibo salvos.");
  return (
    <Secao
      titulo="Dados para o recibo"
      descricao="Saem impressos em todo recibo de aluguel. A chave PIX vai junto na mensagem de cobrança."
      onSubmit={enviar}
      podeSalvar={form.formState.isDirty}
      salvando={pendente}
    >
      <FieldGroup className="grid gap-5 sm:grid-cols-2">
        <CampoTexto control={form.control} name="locadorNome" rotulo="Nome do locador" autoComplete="name" className="sm:col-span-2" />
        <CampoTexto control={form.control} name="locadorDocumento" rotulo="CPF ou CNPJ" opcional inputMode="numeric" mascara={mascararCpfCnpj} />
        <CampoTexto control={form.control} name="locadorTelefone" rotulo="Telefone" opcional inputMode="tel" autoComplete="tel" mascara={mascararTelefone} />
        <CampoTexto control={form.control} name="locadorEmail" rotulo="E-mail" opcional type="email" inputMode="email" autoCapitalize="none" />
        <CampoTexto control={form.control} name="chavePix" rotulo="Chave PIX" opcional autoCapitalize="none" />
      </FieldGroup>
      <AvisoErro mensagem={erro} />
    </Secao>
  );
}

export function FormCobranca({ inicial }: { inicial: DadosCobranca }) {
  const form = useForm<DadosCobranca>({ resolver: zodResolver(esquemaCobranca), defaultValues: inicial });
  const { enviar, pendente, erro } = useEnviar(form, salvarCobranca, "Regras de cobrança salvas.");
  return (
    <Secao
      titulo="Atraso no pagamento"
      descricao="Valem para todos os contratos, a não ser que um contrato diga outra coisa. O sistema sugere multa e juros ao registrar um pagamento atrasado, e você pode isentar."
      onSubmit={enviar}
      podeSalvar={form.formState.isDirty}
      salvando={pendente}
    >
      <FieldGroup className="grid gap-5 sm:grid-cols-3">
        <CampoPercentual control={form.control} name="multaPercentual" rotulo="Multa" descricao="Cobrada uma vez." />
        <CampoPercentual control={form.control} name="jurosMensalPercentual" rotulo="Juros" sufixo="% ao mês" descricao="Proporcional aos dias." />
        <CampoPercentual control={form.control} name="diasCarencia" rotulo="Tolerância" sufixo="dias" descricao="Antes de contar atraso." />
      </FieldGroup>
      <AvisoErro mensagem={erro} />
    </Secao>
  );
}

export function FormEndereco({ inicial }: { inicial: DadosEndereco }) {
  const form = useForm<DadosEndereco>({ resolver: zodResolver(esquemaEndereco), defaultValues: inicial });
  const { enviar, pendente, erro } = useEnviar(form, salvarEndereco, "Residencial atualizado.");

  // CEP completo → busca o endereço nos Correios (ViaCEP) e preenche o que estiver vazio.
  async function buscarCep(cep: string) {
    const digitos = somenteDigitos(cep);
    if (digitos.length !== 8) return;
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const dados = await resposta.json();
      if (dados.erro) {
        form.setError("cep", { message: "Não encontrei esse CEP. Confira ou preencha o endereço à mão." });
        return;
      }
      const preencher = (campo: keyof DadosEndereco, valor?: string) =>
        valor && form.setValue(campo, valor, { shouldDirty: true, shouldValidate: true });
      preencher("logradouro", dados.logradouro);
      preencher("bairro", dados.bairro);
      preencher("cidade", dados.localidade);
      preencher("uf", dados.uf);
    } catch {
      // Sem internet ou serviço fora do ar: a pessoa preenche à mão.
    }
  }

  return (
    <Secao
      titulo="Residencial"
      descricao="Nome e endereço do prédio. Aparecem no recibo e nos relatórios."
      onSubmit={enviar}
      podeSalvar={form.formState.isDirty}
      salvando={pendente}
    >
      <FieldGroup className="grid gap-5 sm:grid-cols-6">
        <CampoTexto control={form.control} name="nome" rotulo="Nome do residencial" className="sm:col-span-6" />
        <CampoTexto
          control={form.control}
          name="cep"
          rotulo="CEP"
          opcional
          inputMode="numeric"
          autoComplete="postal-code"
          mascara={(v) => {
            const m = mascararCEP(v);
            if (somenteDigitos(m).length === 8) void buscarCep(m);
            return m;
          }}
          className="sm:col-span-2"
        />
        <CampoTexto control={form.control} name="logradouro" rotulo="Rua" opcional className="sm:col-span-4" />
        <CampoTexto control={form.control} name="numero" rotulo="Número" opcional inputMode="numeric" className="sm:col-span-2" />
        <CampoTexto control={form.control} name="complemento" rotulo="Complemento" opcional className="sm:col-span-4" />
        <CampoTexto control={form.control} name="bairro" rotulo="Bairro" opcional className="sm:col-span-2" />
        <CampoTexto control={form.control} name="cidade" rotulo="Cidade" opcional className="sm:col-span-3" />
        <CampoSelecao
          control={form.control}
          name="uf"
          rotulo="Estado"
          opcional
          opcoes={UFS.map((uf) => ({ valor: uf, rotulo: uf }))}
          className="sm:col-span-1"
        />
      </FieldGroup>
      <AvisoErro mensagem={erro} />
    </Secao>
  );
}

export function FormTrocarSenha() {
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof esquemaTrocarSenha>>({
    resolver: zodResolver(esquemaTrocarSenha),
    defaultValues: { atual: "", senha: "", confirmacao: "" },
  });

  const trocar = form.handleSubmit(async ({ atual, senha }) => {
    setErro(null);
    const { error } = await authClient.changePassword({ currentPassword: atual, newPassword: senha, revokeOtherSessions: true });
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    toast.success("Senha trocada. Outros aparelhos vão pedir para entrar de novo.");
    form.reset();
  });

  return (
    <Secao
      titulo="Senha"
      descricao="Ao trocar, os outros aparelhos conectados saem da conta."
      onSubmit={trocar}
      podeSalvar={form.formState.isDirty}
      salvando={form.formState.isSubmitting}
      rotuloSalvar="Trocar senha"
    >
      <FieldGroup className="grid gap-5 sm:grid-cols-3">
        <CampoSenha control={form.control} name="atual" rotulo="Senha atual" autoComplete="current-password" />
        <CampoSenha control={form.control} name="senha" rotulo="Nova senha" autoComplete="new-password" />
        <CampoSenha control={form.control} name="confirmacao" rotulo="Repita a nova" autoComplete="new-password" />
      </FieldGroup>
      <AvisoErro mensagem={erro} />
    </Secao>
  );
}
