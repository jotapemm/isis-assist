import type { Metadata } from "next";
import { FormCriarConta } from "@/modulos/acesso/componentes/form-criar-conta";
import { TituloAcesso } from "@/modulos/acesso/componentes/titulo-acesso";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaCriarConta() {
  return (
    <>
      <TituloAcesso titulo="Criar sua conta" subtitulo="Na tela seguinte você informa o nome do residencial." />
      <FormCriarConta />
    </>
  );
}
