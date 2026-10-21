import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { PaginaEmBreve } from "@/components/comum/pagina-em-breve";

export const metadata: Metadata = { title: "Apartamentos" };

export default function Pagina() {
  return (
    <PaginaEmBreve
      titulo="Apartamentos"
      descricao="Os apartamentos do residencial, com status, fotos e histórico."
      icone={Building2}
      oQueVem="O mapa do residencial vem aqui"
      explicacao="Cada apartamento com número, andar, valor de referência e status (livre, ocupado, reservado, reforma ou manutenção), além das fotos e do histórico de quem já morou."
      fase="Fase 1"
    />
  );
}
