"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AvisoErro, Contador, InputMoeda } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { gerarApartamentos } from "../acoes";
import { type AptoGerado, gerarIdentificacoes, LIMITES_LOTE, numerarCasas } from "../lote";
import { nomeAndar } from "../status";
import { type TipoResidencial, vocabulario } from "../vocabulario";

const maiuscula = (texto: string) => texto[0].toUpperCase() + texto.slice(1);

/**
 * Cria várias unidades de uma vez, já numeradas. Prédio: "quantos andares, quantos por andar?".
 * Casas: "quantas casas?" (Casa 01, 02…). A prévia mostra os números antes de confirmar e risca os
 * que já existem — rodar de novo nunca duplica.
 */
export function GeradorLote({
  tipo,
  existentes = [],
  aoConcluir,
}: {
  tipo: TipoResidencial;
  existentes?: string[];
  aoConcluir?: () => void;
}) {
  const v = vocabulario(tipo);
  const casas = tipo === "CASAS";
  const [andares, setAndares] = useState(3);
  const [porAndar, setPorAndar] = useState(4);
  const [comTerreo, setComTerreo] = useState(false);
  const [quantidade, setQuantidade] = useState(10);
  const [valorReferencia, setValorReferencia] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [criando, iniciar] = useTransition();

  const previa = casas ? numerarCasas(quantidade) : gerarIdentificacoes({ andares, porAndar, comTerreo });
  const jaExistem = new Set(existentes.map((e) => e.toLowerCase()));
  const novos = previa.filter((a) => !jaExistem.has(a.identificacao.toLowerCase())).length;

  function criar() {
    setErro(null);
    iniciar(async () => {
      const r = await gerarApartamentos(
        casas ? { modo: "CASAS", quantidade, valorReferencia } : { modo: "ANDARES", andares, porAndar, comTerreo, valorReferencia },
      );
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      const { criados, pulados } = r.dados;
      toast.success(
        criados === 0
          ? `${maiuscula(v.todos)} ${v.esses} ${v.plural} já existiam.`
          : `${criados} ${criados === 1 ? `${v.singular} ${v.cadastrado}` : `${v.plural} ${v.cadastrados}`}.` +
              (pulados ? ` ${pulados} já existiam e ficaram como estavam.` : ""),
      );
      aoConcluir?.();
    });
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      {casas ? (
        <Contador id="lote-casas" rotulo="Quantas casas?" valor={quantidade} aoMudar={setQuantidade} minimo={1} maximo={LIMITES_LOTE.casas} />
      ) : (
        <>
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
        </>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="lote-valor" className="text-sm font-medium">
          Aluguel de referência <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <InputMoeda id="lote-valor" centavos={valorReferencia} aoMudar={setValorReferencia} className="sm:max-w-56" />
        <p className="text-sm text-muted-foreground">
          Vale para {v.todos}; dá para ajustar {v.cadaUm} depois.
        </p>
      </div>

      <div className="rounded-xl bg-muted/70 p-4">
        <p className="text-sm font-medium">
          {novos === previa.length ? (
            <>
              Vão ser {v.criados} <strong className="tabular-nums">{novos}</strong> {v.plural}:
            </>
          ) : (
            <>
              <strong className="tabular-nums">{novos}</strong> {novos === 1 ? `${v.singular} ${v.novo.toLowerCase()}` : `${v.plural} ${v.novos}`}
              {" "}— {v.osOutros} {previa.length - novos} já existem e ficam como estão:
            </>
          )}
        </p>
        <Previa previa={previa} jaExistem={jaExistem} casas={casas} />
        <p className="mt-3 text-sm text-muted-foreground">
          {v.o === "a" ? "As" : "Os"} {v.novos} começam como Livre.
        </p>
      </div>

      <AvisoErro mensagem={erro} />
      <Button type="button" size="lg" onClick={criar} disabled={criando || novos === 0} className="sm:self-start">
        {criando
          ? "Criando…"
          : novos === 0
            ? "Nada novo para criar"
            : `Criar ${novos} ${novos === 1 ? v.singular : v.plural}`}
      </Button>
    </div>
  );
}

function Numero({ id, existe }: { id: string; existe: boolean }) {
  return <span className={cn("mr-2", existe && "text-muted-foreground line-through")}>{id}</span>;
}

/** Prédio: uma linha por andar (de cima para baixo). Casas: a sequência, cortada se for longa. */
function Previa({ previa, jaExistem, casas }: { previa: AptoGerado[]; jaExistem: Set<string>; casas: boolean }) {
  const existe = (id: string) => jaExistem.has(id.toLowerCase());

  if (casas) {
    const MOSTRAR = 30;
    return (
      <p className="mt-3 font-mono text-sm leading-relaxed tabular-nums">
        {previa.slice(0, MOSTRAR).map((c) => (
          <Numero key={c.identificacao} id={c.identificacao} existe={existe(c.identificacao)} />
        ))}
        {previa.length > MOSTRAR && <span className="font-sans text-muted-foreground">… até {previa.at(-1)!.identificacao}</span>}
      </p>
    );
  }

  const porAndar = new Map<number, AptoGerado[]>();
  for (const apto of previa) porAndar.set(apto.andar ?? 0, [...(porAndar.get(apto.andar ?? 0) ?? []), apto]);
  const andares = [...porAndar.keys()].sort((a, b) => b - a);
  const MOSTRAR = 5;
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {andares.slice(0, MOSTRAR).map((andar) => (
        <li key={andar} className="flex items-baseline gap-3 text-sm">
          <span className="w-20 shrink-0 text-muted-foreground">{nomeAndar(andar)}</span>
          <span className="font-mono tabular-nums">
            {porAndar.get(andar)!.map((a) => (
              <Numero key={a.identificacao} id={a.identificacao} existe={existe(a.identificacao)} />
            ))}
          </span>
        </li>
      ))}
      {andares.length > MOSTRAR && <li className="text-sm text-muted-foreground">e mais {andares.length - MOSTRAR} andares abaixo…</li>}
    </ul>
  );
}
