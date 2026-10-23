"use client";

import { FileText, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { linkWhatsApp } from "@/lib/whatsapp";
import { SITUACAO, type Situacao } from "../regras";

export function SeloSituacao({ situacao, className }: { situacao: Situacao; className?: string }) {
  const { rotulo, classe } = SITUACAO[situacao];
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", classe, className)}>
      {rotulo}
    </span>
  );
}

/**
 * No celular, abre o "compartilhar" do aparelho com o PDF do recibo (dá para mandar direto no WhatsApp).
 * No computador, onde isso não existe, abre o PDF numa aba nova.
 */
export function BotaoCompartilharRecibo({ pagamentoId, numero }: { pagamentoId: string; numero: number }) {
  async function compartilhar() {
    const url = `/api/recibos/${pagamentoId}`;
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error(await resposta.text());
      const arquivo = new File([await resposta.blob()], `recibo-${String(numero).padStart(4, "0")}.pdf`, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: `Recibo nº ${numero}` });
        return;
      }
    } catch (erro) {
      if ((erro as Error).name === "AbortError") return; // a pessoa fechou o compartilhar
    }
    window.open(url, "_blank", "noopener");
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void compartilhar().catch(() => toast.error("Não consegui abrir o recibo."))}>
      <Share2 className="size-4" />
      Compartilhar recibo
    </Button>
  );
}

export function BotaoVerRecibo({ pagamentoId }: { pagamentoId: string }) {
  return (
    <Button asChild variant="ghost" size="sm">
      <a href={`/api/recibos/${pagamentoId}`} target="_blank" rel="noopener noreferrer">
        <FileText className="size-4" />
        Ver PDF
      </a>
    </Button>
  );
}

/** Abre o WhatsApp da usuária com a mensagem pronta (custo zero; a cobrança automática é do v2). */
export function BotaoMensagem({ telefone, mensagem, rotulo }: { telefone: string | null; mensagem: string; rotulo: string }) {
  const link = telefone && linkWhatsApp(telefone, mensagem);
  if (!link) return null;
  return (
    <Button asChild variant="outline" size="sm" className="border-[#1f9d55]/40 text-[#178046] hover:bg-[#1f9d55]/10 hover:text-[#178046] dark:text-[#4cd387]">
      <a href={link} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-4" />
        {rotulo}
      </a>
    </Button>
  );
}
