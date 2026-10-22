"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { mudarStatus } from "../acoes";
import { STATUS, STATUS_APARTAMENTO, type StatusApartamento } from "../status";
import { SeloStatus } from "./selo-status";

export function MudarStatus({
  apartamentoId,
  identificacao,
  atual,
}: {
  apartamentoId: string;
  identificacao: string;
  atual: StatusApartamento;
}) {
  const [aberto, setAberto] = useState(false);
  const [escolhido, setEscolhido] = useState<StatusApartamento | null>(null);
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function abrirOuFechar(abrir: boolean) {
    setAberto(abrir);
    if (abrir) {
      setEscolhido(null);
      setMotivo("");
      setErro(null);
    }
  }

  function salvar() {
    if (!escolhido) return;
    iniciar(async () => {
      const r = await mudarStatus(apartamentoId, { status: escolhido, motivo });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      toast.success(`Apto ${identificacao} agora está como ${STATUS[escolhido].rotulo}.`);
      setAberto(false);
    });
  }

  return (
    <Sheet open={aberto} onOpenChange={abrirOuFechar}>
      <SheetTrigger className="group inline-flex items-center gap-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <SeloStatus status={atual} className="pr-2 group-hover:brightness-95" />
        <span className="flex items-center gap-0.5 text-sm font-medium text-primary underline-offset-4 group-hover:underline">
          Mudar status
          <ChevronDown className="size-4" aria-hidden="true" />
        </span>
      </SheetTrigger>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-lg overflow-y-auto rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle>Status do apto {identificacao}</SheetTitle>
          <SheetDescription>A mudança fica registrada no histórico do apartamento.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div role="radiogroup" aria-label="Novo status" className="flex flex-col gap-2">
            {STATUS_APARTAMENTO.map((status) => {
              const info = STATUS[status];
              const Icone = info.icone;
              const ehAtual = status === atual;
              const marcado = escolhido === status;
              return (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={marcado}
                  disabled={ehAtual}
                  onClick={() => setEscolhido(status)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-colors disabled:opacity-60",
                    marcado ? cn(info.borda, info.fundo) : "border-border hover:bg-muted/60",
                  )}
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", info.fundo, info.texto)}>
                    <Icone className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold">
                      {info.rotulo}
                      {ehAtual && <span className="ml-2 text-sm font-normal text-muted-foreground">(atual)</span>}
                    </span>
                    <span className="text-sm text-muted-foreground">{info.explicacao}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="motivo-status" className="text-sm font-medium">
              Motivo <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="motivo-status"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: pintura antes do próximo inquilino"
              className="min-h-16"
              maxLength={300}
            />
          </div>

          <AvisoErro mensagem={erro} />
          <Button size="lg" onClick={salvar} disabled={!escolhido || salvando}>
            {salvando ? "Salvando…" : escolhido ? `Mudar para ${STATUS[escolhido].rotulo}` : "Escolha o novo status"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
