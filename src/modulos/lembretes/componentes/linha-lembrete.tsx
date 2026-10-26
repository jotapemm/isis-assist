"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Check, Repeat, Undo2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatarData, hojeISO } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import type { Vocabulario } from "@/modulos/apartamentos/vocabulario";
import { concluirLembrete, reabrirLembrete } from "../acoes";
import type { LembreteLinha } from "../consultas";
import { quandoE, RECORRENCIA, sugereManutencao } from "../regras";

/** Um lembrete na lista: círculo para concluir, o texto (toque para editar) e a ação sugerida. */
export function LinhaLembrete({
  l,
  v,
  hoje,
  atrasado,
  aoAbrir,
}: {
  l: LembreteLinha;
  v: Vocabulario;
  hoje: string;
  atrasado?: boolean;
  aoAbrir: (l: LembreteLinha) => void;
}) {
  const [ocupado, iniciar] = useTransition();
  const concluido = l.concluidoEm !== null;
  // Só o título: nos detalhes, "conferir a pintura" (numa vistoria) não é pedido de conserto.
  const conserto = !concluido && sugereManutencao(l.titulo);
  // O que repete já gerou a próxima ocorrência ao ser concluído: reabrir daqui duplicaria. (O "Desfazer"
  // do aviso, logo após concluir, sabe qual apagar.)
  const podeReabrir = concluido && l.recorrencia === "NENHUMA";

  function concluir() {
    iniciar(async () => {
      const r = await concluirLembrete(l.id);
      if (!r.ok) return void toast.error(r.erro);
      const { proximoId, proximaData } = r.dados;
      toast.success(proximaData ? `Feito. O próximo fica para ${formatarData(proximaData)}.` : "Feito.", {
        action: { label: "Desfazer", onClick: () => void reabrirLembrete(l.id, proximoId) },
        // Tempo para achar o "Desfazer" (o padrão de 4 s some rápido demais).
        duration: 10_000,
      });
    });
  }

  function reabrir() {
    iniciar(async () => {
      await reabrirLembrete(l.id);
    });
  }

  const meta = [
    l.data && quandoE(l.data, l.hora, hoje),
    l.apartamento && v.nome(l.apartamento.identificacao),
    concluido && l.concluidoEm && `feito em ${formatarData(hojeISO(new Date(l.concluidoEm)))}`,
  ].filter(Boolean);

  return (
    <li className="flex items-start gap-3 py-3">
      {concluido ? (
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-livre text-white" aria-hidden="true">
          <Check className="size-4" />
        </span>
      ) : (
        <button
          type="button"
          onClick={concluir}
          disabled={ocupado}
          aria-label={`Concluir: ${l.titulo}`}
          className={cn(
            "mt-0.5 size-7 shrink-0 rounded-full border-2 transition-colors hover:bg-livre/15",
            l.importante ? "border-reservado" : "border-muted-foreground/50",
          )}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <button type="button" onClick={() => aoAbrir(l)} className="flex flex-col items-start text-left">
          <span className={cn("font-medium leading-snug", concluido && "text-muted-foreground line-through", l.importante && !concluido && "text-foreground")}>
            {l.importante && !concluido && <span className="mr-1.5 text-reservado">●</span>}
            {l.titulo}
          </span>
          {l.descricao && !concluido && <span className="line-clamp-2 text-sm text-muted-foreground">{l.descricao}</span>}
          {(meta.length > 0 || l.recorrencia !== "NENHUMA") && (
            <span className={cn("flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground", atrasado && "text-destructive")}>
              {meta.join(" · ")}
              {l.recorrencia !== "NENHUMA" && !concluido && (
                <span className="inline-flex items-center gap-1">
                  <Repeat className="size-3.5" aria-hidden="true" />
                  {RECORRENCIA[l.recorrencia].curto}
                </span>
              )}
            </span>
          )}
        </button>
        {conserto && (
          <Button asChild variant="outline" size="sm" className="self-start">
            <Link
              href={`/manutencoes/nova?titulo=${encodeURIComponent(l.titulo)}${l.apartamento ? `&apto=${l.apartamento.id}` : ""}`}
            >
              <Wrench className="size-4" />
              Abrir ordem de serviço
            </Link>
          </Button>
        )}
      </div>
      {podeReabrir && (
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={reabrir} disabled={ocupado}>
          <Undo2 className="size-4" />
          Desfazer
        </Button>
      )}
    </li>
  );
}
