"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AvisoErro, Contador, InputMoeda } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { gerarApartamentos } from "../acoes";
import { gerarIdentificacoes, LIMITES_LOTE } from "../lote";
import { nomeAndar } from "../status";

/**
 * "Quantos andares? Quantos por andar?" → cria todos os aptos de uma vez, já numerados.
 * A prévia mostra exatamente os números que vão ser criados antes de confirmar.
 */
export function GeradorLote({ existentes = [], aoConcluir }: { existentes?: string[]; aoConcluir?: () => void }) {
  const [andares, setAndares] = useState(3);
  const [porAndar, setPorAndar] = useState(4);
  const [comTerreo, setComTerreo] = useState(false);
  const [valorReferencia, setValorReferencia] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, iniciar] = useTransition();

  const previa = gerarIdentificacoes({ andares, porAndar, comTerreo });
  const jaExistem = new Set(existentes.map((e) => e.toLowerCase()));
  const novos = previa.filter((a) => !jaExistem.has(a.identificacao.toLowerCase())).length;
  const porAndarNaPrevia = new Map<number, typeof previa>();
  for (const apto of previa) porAndarNaPrevia.set(apto.andar, [...(porAndarNaPrevia.get(apto.andar) ?? []), apto]);
  const andaresNaPrevia = [...porAndarNaPrevia.keys()].sort((a, b) => b - a);
  const MOSTRAR = 5;

  function criar() {
    setErro(null);
    iniciar(async () => {
      const r = await gerarApartamentos({ andares, porAndar, comTerreo, valorReferencia });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      const { criados, pulados } = r.dados;
      toast.success(
        criados === 0
          ? "Todos esses apartamentos já existiam."
          : `${criados} ${criados === 1 ? "apartamento criado" : "apartamentos criados"}.` +
              (pulados ? ` ${pulados} já existiam e ficaram como estavam.` : ""),
      );
      aoConcluir?.();
    });
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="grid gap-5 sm:grid-cols-2">
        <Contador id="lote-andares" rotulo="Andares (sem contar o térreo)" valor={andares} aoMudar={setAndares} minimo={1} maximo={LIMITES_LOTE.andares} />
        <Contador id="lote-por-andar" rotulo="Apartamentos por andar" valor={porAndar} aoMudar={setPorAndar} minimo={1} maximo={LIMITES_LOTE.porAndar} />
      </div>

      <label className="flex items-start gap-3">
        <Switch checked={comTerreo} onCheckedChange={setComTerreo} className="mt-0.5" />
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">O térreo também tem apartamentos</span>
          <span className="text-sm text-muted-foreground">Eles ficam numerados como 01, 02, 03…</span>
        </span>
      </label>

      <div className="flex flex-col gap-2">
        <label htmlFor="lote-valor" className="text-sm font-medium">
          Aluguel de referência <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <InputMoeda id="lote-valor" centavos={valorReferencia} aoMudar={setValorReferencia} className="sm:max-w-56" />
        <p className="text-sm text-muted-foreground">Vale para todos; dá para ajustar cada um depois.</p>
      </div>

      <div className="rounded-xl bg-muted/70 p-4">
        <p className="text-sm font-medium">
          {novos === previa.length ? (
            <>
              Vão ser criados <strong className="tabular-nums">{novos}</strong> apartamentos:
            </>
          ) : (
            <>
              <strong className="tabular-nums">{novos}</strong> {novos === 1 ? "apartamento novo" : "apartamentos novos"}
              {" "}— os outros {previa.length - novos} já existem e ficam como estão:
            </>
          )}
        </p>
        <ul className="mt-3 flex flex-col gap-1.5">
          {andaresNaPrevia.slice(0, MOSTRAR).map((andar) => (
            <li key={andar} className="flex items-baseline gap-3 text-sm">
              <span className="w-20 shrink-0 text-muted-foreground">{nomeAndar(andar)}</span>
              <span className="font-mono tabular-nums">
                {porAndarNaPrevia.get(andar)!.map((a) => (
                  <span key={a.identificacao} className={cn("mr-2", jaExistem.has(a.identificacao.toLowerCase()) && "text-muted-foreground line-through")}>
                    {a.identificacao}
                  </span>
                ))}
              </span>
            </li>
          ))}
          {andaresNaPrevia.length > MOSTRAR && (
            <li className="text-sm text-muted-foreground">e mais {andaresNaPrevia.length - MOSTRAR} andares abaixo…</li>
          )}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">Os novos começam como Livre.</p>
      </div>

      <AvisoErro mensagem={erro} />
      <Button type="button" size="lg" onClick={criar} disabled={criando || novos === 0} className="sm:self-start">
        {criando ? "Criando…" : novos === 0 ? "Nada novo para criar" : `Criar ${novos} ${novos === 1 ? "apartamento" : "apartamentos"}`}
      </Button>
    </div>
  );
}
