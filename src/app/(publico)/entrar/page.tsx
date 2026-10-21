import type { Metadata } from "next";
import { FormEntrar } from "@/modulos/acesso/componentes/form-entrar";
import { TituloAcesso } from "@/modulos/acesso/componentes/titulo-acesso";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaEntrar() {
  return (
    <>
      <TituloAcesso titulo="Entrar" subtitulo="Use o e-mail e a senha da sua conta." />
      <FormEntrar />
    </>
  );
}
