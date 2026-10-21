import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { PaginaEmBreve } from "@/components/comum/pagina-em-breve";

export const metadata: Metadata = { title: "Financeiro" };

export default function Pagina() {
  return (
    <PaginaEmBreve
      titulo="Financeiro"
      descricao="Aluguéis a receber, pagamentos, recibos e despesas."
      icone={Wallet}
      oQueVem="Os recebimentos vêm aqui"
      explicacao="As cobranças de cada mês são geradas sozinhas. Você registra o pagamento em três toques, envia o recibo pelo WhatsApp e lança as despesas."
      fase="Fase 3"
    />
  );
}
