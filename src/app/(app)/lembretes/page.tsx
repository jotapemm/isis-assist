import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { PaginaEmBreve } from "@/components/comum/pagina-em-breve";

export const metadata: Metadata = { title: "Lembretes" };

export default function Pagina() {
  return (
    <PaginaEmBreve
      titulo="Lembretes"
      descricao="Anotações e lembretes, em lista ou no calendário."
      icone={CalendarCheck}
      oQueVem="Seus lembretes vêm aqui"
      explicacao="Anote o que precisa lembrar, com data, prioridade e repetição. Alguns lembretes sugerem a ação certa, como colocar um imóvel em manutenção."
      fase="Fase 5"
    />
  );
}
