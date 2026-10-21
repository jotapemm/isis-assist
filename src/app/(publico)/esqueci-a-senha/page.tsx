import type { Metadata } from "next";
import { FormEsqueciSenha } from "@/modulos/acesso/componentes/form-esqueci-senha";
import { TituloAcesso } from "@/modulos/acesso/componentes/titulo-acesso";

export const metadata: Metadata = { title: "Esqueci a senha" };

export default function PaginaEsqueciSenha() {
  return (
    <>
      <TituloAcesso
        titulo="Esqueceu a senha?"
        subtitulo="Digite o e-mail da conta. Mandamos um link para você criar uma senha nova."
      />
      <FormEsqueciSenha />
    </>
  );
}
