import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { TituloAcesso } from "@/modulos/acesso/componentes/titulo-acesso";
import { FormAceitarTermos } from "@/modulos/legal/componentes/form-aceitar-termos";
import { VERSAO_TERMOS } from "@/modulos/legal/versao";
import { exigirSessao } from "@/server/contexto";

export const metadata: Metadata = { title: "Termos de Uso" };

/** Para quem já tinha conta quando os Termos e a Política entraram (ou mudaram): aceite antes de seguir. */
export default function PaginaAceitarTermos() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  const { user } = await exigirSessao();
  if (user.termosVersao === VERSAO_TERMOS) redirect("/");

  return (
    <>
      <TituloAcesso
        titulo={user.termosVersao ? "Os termos mudaram" : "Termos e privacidade"}
        subtitulo="Para seguir usando o Isis-Assist, leia e aceite os Termos de Uso e a Política de Privacidade. Eles explicam como os seus dados e os dos inquilinos são cuidados."
      />
      <FormAceitarTermos />
    </>
  );
}
