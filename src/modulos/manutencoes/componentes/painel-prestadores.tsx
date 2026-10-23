"use client";

import { useState } from "react";
import { HardHat, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/lib/formatar";
import { mascararTelefone } from "@/lib/mascaras";
import { BotaoLigar, BotaoWhatsApp } from "@/modulos/inquilinos/componentes/botoes-contato";
import { GavetaPrestador, type PrestadorEditavel } from "./gaveta-prestador";

type Prestador = PrestadorEditavel & { servicos: number; abertas: number; totalPago: number };

export function PainelPrestadores({ prestadores }: { prestadores: Prestador[] }) {
  const [aberto, setAberto] = useState<Prestador | "novo" | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" onClick={() => setAberto("novo")}>
        <Plus className="size-4" />
        Novo prestador
      </Button>

      {prestadores.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-4 py-10 text-center">
          <HardHat className="size-8 text-primary" aria-hidden="true" />
          <p className="font-medium">Nenhum prestador cadastrado</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Encanador, eletricista, pintor… cadastrando, eles aparecem na hora de abrir uma ordem de serviço, com o contato à mão.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {prestadores.map((p) => (
            <li key={p.id} className="flex items-center gap-2 pr-3">
              <button type="button" onClick={() => setAberto(p)} className="flex min-w-0 flex-1 flex-col py-3 pl-4 text-left hover:bg-muted/60">
                <span className="truncate font-medium">
                  {p.nome}
                  {p.especialidade && <span className="font-normal text-muted-foreground"> · {p.especialidade}</span>}
                </span>
                <span className="truncate text-sm text-muted-foreground tabular-nums">
                  {[
                    p.telefone && mascararTelefone(p.telefone),
                    p.servicos > 0 && `${p.servicos} ${p.servicos === 1 ? "serviço" : "serviços"} · ${formatarMoeda(p.totalPago)}`,
                    p.abertas > 0 && `${p.abertas} em aberto`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sem telefone"}
                </span>
              </button>
              {/* Contato profissional que o próprio prestador passou: o WhatsApp vale sem o aceite dos inquilinos. */}
              <BotaoWhatsApp telefone={p.telefone} nome={p.nome} aceita compacto />
              <span className="hidden sm:block">
                <BotaoLigar telefone={p.telefone} nome={p.nome} />
              </span>
            </li>
          ))}
        </ul>
      )}

      <GavetaPrestador aberta={aberto !== null} prestador={aberto === "novo" ? null : aberto} aoFechar={() => setAberto(null)} />
    </div>
  );
}
