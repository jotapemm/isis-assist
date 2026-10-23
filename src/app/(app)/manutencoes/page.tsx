import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { PaginaEmBreve } from "@/components/comum/pagina-em-breve";

export const metadata: Metadata = { title: "Manutenções" };

export default function Pagina() {
  return (
    <PaginaEmBreve
      titulo="Manutenções"
      descricao="Consertos, prestadores de serviço e quanto custou cada um."
      icone={Wrench}
      oQueVem="As ordens de serviço vêm aqui"
      explicacao="Abra um chamado para um imóvel, acompanhe até concluir e o custo vira despesa automaticamente."
      fase="Fase 4"
    />
  );
}
