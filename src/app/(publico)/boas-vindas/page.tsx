import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { FormBoasVindas } from "@/modulos/acesso/componentes/form-boas-vindas";
import { TituloAcesso } from "@/modulos/acesso/componentes/titulo-acesso";
import { exigirSessao } from "@/server/contexto";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Boas-vindas" };

export default function PaginaBoasVindas() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
      <BoasVindas />
    </Suspense>
  );
}

async function BoasVindas() {
  const { user } = await exigirSessao();
  // Quem já tem residencial não precisa passar por aqui de novo.
  if (await db.member.findFirst({ where: { userId: user.id }, select: { id: true } })) redirect("/");

  return (
    <>
      <TituloAcesso
        titulo={`Boas-vindas, ${user.name.split(" ")[0]}!`}
        subtitulo="Para começar, como se chama o seu residencial?"
      />
      <FormBoasVindas />
    </>
  );
}
