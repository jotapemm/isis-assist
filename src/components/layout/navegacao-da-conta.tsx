import { tipoDaConta } from "@/modulos/apartamentos/consultas";
import { obterContexto } from "@/server/contexto";
import { ListaLateralAtiva } from "./barra-lateral";
import { MenuInferiorAtivo } from "./menu-inferior";

async function tipoAtual() {
  const ctx = await obterContexto();
  return ctx ? tipoDaConta(ctx) : null;
}

/** Lê a conta (dinâmico): sempre dentro de um <Suspense> no layout. */
export async function ListaLateralDaConta() {
  return <ListaLateralAtiva tipo={await tipoAtual()} />;
}

export async function MenuInferiorDaConta({ sair }: { sair: React.ReactNode }) {
  return <MenuInferiorAtivo sair={sair} tipo={await tipoAtual()} />;
}
