import type { Metadata } from "next";
import { Suspense } from "react";
import { FormRedefinirSenha } from "@/modulos/acesso/componentes/form-redefinir-senha";
import { TituloAcesso } from "@/modulos/acesso/componentes/titulo-acesso";

export const metadata: Metadata = { title: "Nova senha" };

export default function PaginaRedefinirSenha({ searchParams }: PageProps<"/redefinir-senha">) {
  return (
    <>
      <TituloAcesso titulo="Criar nova senha" />
      <Suspense>
        <Formulario busca={searchParams} />
      </Suspense>
    </>
  );
}

// O link do e-mail chega como ?token=… (ou ?error=INVALID_TOKEN se já venceu).
async function Formulario({ busca }: { busca: PageProps<"/redefinir-senha">["searchParams"] }) {
  const { token, error } = await busca;
  return <FormRedefinirSenha token={!error && typeof token === "string" ? token : null} />;
}
