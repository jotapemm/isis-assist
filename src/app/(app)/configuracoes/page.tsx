import type { Metadata } from "next";
import { Suspense } from "react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoFormulario } from "@/components/comum/esqueleto";
import { SeletorTema } from "@/components/layout/seletor-tema";
import { obterConfiguracoes } from "@/modulos/conta/consultas";
import {
  FormCobranca,
  FormEndereco,
  FormLocador,
  FormTrocarSenha,
} from "@/modulos/conta/componentes/formularios-configuracoes";
import { Secao } from "@/modulos/conta/componentes/secao";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Configurações" };

export default function PaginaConfiguracoes() {
  return (
    <>
      <CabecalhoPagina titulo="Configurações" descricao="Seus dados, o residencial e as regras de cobrança." />
      <Suspense fallback={<EsqueletoFormulario />}>
        <FormulariosDaConta />
      </Suspense>
      <Secao titulo="Aparência" descricao="Claro, escuro, ou acompanhando o modo do celular.">
        <SeletorTema comRotulos />
      </Secao>
      <FormTrocarSenha />
    </>
  );
}

async function FormulariosDaConta() {
  const ctx = await exigirContexto();
  const config = await obterConfiguracoes(ctx);
  return (
    <>
      <FormEndereco inicial={config.endereco} />
      <FormLocador inicial={config.locador} />
      <FormCobranca inicial={config.cobranca} />
    </>
  );
}
