import type { Metadata } from "next";
import { Suspense } from "react";
import { VoltarPara } from "@/components/comum/blocos";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { hojeISO } from "@/lib/formatar";
import { EscolhaRelatorios } from "@/modulos/relatorios/componentes/escolha-relatorios";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Relatórios" };

export default function PaginaRelatorios() {
  return (
    <>
      <VoltarPara href="/financeiro" rotulo="Financeiro" />
      <CabecalhoPagina
        titulo="Relatórios"
        descricao="Para conferir o resultado e entregar ao contador. Em PDF para ler e compartilhar; em Excel para fazer contas."
      />
      <Suspense fallback={<EsqueletoBloco className="h-72" />}>
        <Conteudo />
      </Suspense>
      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        As receitas seguem o regime de caixa: cada pagamento conta no mês em que foi recebido, mesmo quando o aluguel é de outro
        mês. É assim que o imposto de renda pede.
      </p>
    </>
  );
}

async function Conteudo() {
  // Só para garantir a conta (o resto é escolha do período, no navegador).
  await exigirContexto();
  return <EscolhaRelatorios hoje={hojeISO()} />;
}
