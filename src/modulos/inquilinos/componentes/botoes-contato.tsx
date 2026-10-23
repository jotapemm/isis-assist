import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { linkTelefone, linkWhatsApp } from "@/lib/whatsapp";

/**
 * Abre a conversa no WhatsApp da própria usuária, já com um "Olá, Fulano!". Só aparece se o inquilino
 * aceitou ser chamado por lá (LGPD) — sem aceite, sobra o "Ligar".
 */
export function BotaoWhatsApp({
  telefone,
  nome,
  aceita,
  compacto = false,
  className,
}: {
  telefone: string | null;
  nome: string;
  aceita: boolean;
  compacto?: boolean;
  className?: string;
}) {
  const link = aceita && telefone && linkWhatsApp(telefone, `Olá, ${nome.split(" ")[0]}!`);
  if (!link) return null;
  return (
    <Button
      asChild
      variant="outline"
      size={compacto ? "icon" : "default"}
      className={cn("border-[#1f9d55]/40 text-[#178046] hover:bg-[#1f9d55]/10 hover:text-[#178046] dark:text-[#4cd387]", className)}
    >
      <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Conversar com ${nome} no WhatsApp`}>
        <MessageCircle className="size-[1.15rem]" aria-hidden="true" />
        {!compacto && "WhatsApp"}
      </a>
    </Button>
  );
}

export function BotaoLigar({ telefone, nome }: { telefone: string | null; nome: string }) {
  const link = telefone && linkTelefone(telefone);
  if (!link) return null;
  return (
    <Button asChild variant="outline">
      <a href={link} aria-label={`Ligar para ${nome}`}>
        <Phone className="size-4" aria-hidden="true" />
        Ligar
      </a>
    </Button>
  );
}
