import type { Metadata } from "next";
import { FileSignature } from "lucide-react";
import { PaginaEmBreve } from "@/components/comum/pagina-em-breve";

export const metadata: Metadata = { title: "Contratos" };

export default function Pagina() {
  return (
    <PaginaEmBreve
      titulo="Contratos"
      descricao="Quem aluga o quê, por quanto e até quando."
      icone={FileSignature}
      oQueVem="Os contratos vêm aqui"
      explicacao="Um passo a passo para alugar um apartamento em poucos toques, com reajuste anual calculado (IGP-M, IPCA ou percentual fixo) e o PDF do contrato anexado."
      fase="Fase 2"
    />
  );
}
