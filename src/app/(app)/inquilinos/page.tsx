import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PaginaEmBreve } from "@/components/comum/pagina-em-breve";

export const metadata: Metadata = { title: "Inquilinos" };

export default function Pagina() {
  return (
    <PaginaEmBreve
      titulo="Inquilinos"
      descricao="Quem mora e quem já morou: contatos, fiador e documentos."
      icone={Users}
      oQueVem="A lista de inquilinos vem aqui"
      explicacao="Nome, CPF, telefone com botão de WhatsApp, contato de emergência, fiador e documentos guardados em um só lugar."
      fase="Fase 1"
    />
  );
}
