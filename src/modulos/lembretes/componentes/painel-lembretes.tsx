"use client";

import Link from "next/link";
import { useState } from "react";
import { BellPlus, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { distanciaEmDias } from "@/lib/datas";
import { formatarData } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import type { EventoDoSistema, LembreteLinha } from "../consultas";
import { type Grupo, GRUPOS, grupoDoLembrete } from "../regras";
import { Calendario, IconeEvento, rotuloEvento } from "./calendario";
import { GavetaLembrete } from "./gaveta-lembrete";
import { LinhaLembrete } from "./linha-lembrete";

type Props = {
  ver: "lista" | "calendario";
  competencia: string;
  hoje: string;
  lembretes: LembreteLinha[];
  /** Reajustes e fins de contrato dos próximos 30 dias (lista). */
  avisos: EventoDoSistema[];
  /** Tudo do sistema no mês, inclusive aluguéis (calendário). */
  eventosDoMes: EventoDoSistema[];
  aptos: { id: string; identificacao: string }[];
  tipo: TipoResidencial;
  abrirNovo?: boolean;
  aptoInicial?: string;
};

type Gaveta = { lembrete: LembreteLinha | null; data?: string } | null;

export function PainelLembretes(props: Props) {
  const { ver, hoje, lembretes, tipo } = props;
  const v = vocabulario(tipo);
  const [gaveta, setGaveta] = useState<Gaveta>(props.abrirNovo ? { lembrete: null } : null);
  const abrir = (l: LembreteLinha) => setGaveta({ lembrete: l });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Como ver" className="inline-flex gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["lista", "Lista", List, "/lembretes"],
              ["calendario", "Calendário", CalendarDays, "/lembretes?ver=calendario"],
            ] as const
          ).map(([valor, rotulo, Icone, href]) => (
            <Link
              key={valor}
              href={href}
              role="radio"
              aria-checked={ver === valor}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground",
                ver === valor && "bg-card text-foreground shadow-sm",
              )}
            >
              <Icone className="size-4" aria-hidden="true" />
              {rotulo}
            </Link>
          ))}
        </div>
        <Button onClick={() => setGaveta({ lembrete: null })}>
          <BellPlus className="size-4" />
          Novo lembrete
        </Button>
      </div>

      {ver === "calendario" ? (
        <Calendario
          competencia={props.competencia}
          hoje={hoje}
          lembretes={lembretes.filter((l) => !l.concluidoEm)}
          eventos={props.eventosDoMes}
          v={v}
          aoAbrir={abrir}
          aoNovo={(data) => setGaveta({ lembrete: null, data })}
        />
      ) : (
        <Lista {...props} v={v} aoAbrir={abrir} aoNovo={() => setGaveta({ lembrete: null })} />
      )}

      <GavetaLembrete
        aberta={gaveta !== null}
        lembrete={gaveta?.lembrete ?? null}
        aptos={props.aptos}
        tipo={tipo}
        hoje={hoje}
        inicial={{ data: gaveta?.data, apartamentoId: props.aptoInicial }}
        aoFechar={() => setGaveta(null)}
      />
    </div>
  );
}

function Lista({
  lembretes,
  avisos,
  hoje,
  v,
  aoAbrir,
  aoNovo,
}: Props & { v: ReturnType<typeof vocabulario>; aoAbrir: (l: LembreteLinha) => void; aoNovo: () => void }) {
  if (lembretes.length === 0 && avisos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card px-4 py-10 text-center">
        <BellPlus className="size-8 text-primary" aria-hidden="true" />
        <p className="font-medium">Nenhum lembrete ainda</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Leitura do relógio de água, vistoria de saída, ligar para o interessado… Sem data, vira anotação.
        </p>
        <Button onClick={aoNovo}>Criar o primeiro</Button>
      </div>
    );
  }

  // Sem Object.groupBy: não existe no Safari dos iPhones mais antigos (antes do iOS 17.4).
  const porGrupo: Partial<Record<Grupo, LembreteLinha[]>> = {};
  for (const l of lembretes) (porGrupo[grupoDoLembrete(l, hoje)] ??= []).push(l);
  return (
    <div className="flex flex-col gap-6">
      {GRUPOS.map(({ grupo, titulo }) => {
        const itens = porGrupo[grupo] ?? [];
        const secao =
          itens.length > 0 ? (
            <section key={grupo} aria-label={titulo} className="flex flex-col gap-1">
              <h2 className={cn("font-heading text-lg", grupo === "ATRASADO" && "text-destructive")}>
                {titulo} <span className="text-sm text-muted-foreground tabular-nums">{itens.length}</span>
              </h2>
              <ul className="divide-y rounded-2xl border bg-card px-4">
                {itens.map((l) => (
                  <LinhaLembrete key={l.id} l={l} v={v} hoje={hoje} atrasado={grupo === "ATRASADO"} aoAbrir={aoAbrir} />
                ))}
              </ul>
            </section>
          ) : null;
        // Os avisos do sistema entram depois do que é desta semana.
        return grupo === "DEPOIS" && avisos.length > 0 ? (
          <div key={grupo} className="flex flex-col gap-6">
            <AvisosDoSistema avisos={avisos} hoje={hoje} v={v} />
            {secao}
          </div>
        ) : (
          secao
        );
      })}
    </div>
  );
}

/** Reajuste e fim de contrato: aparecem sozinhos e somem quando são resolvidos no contrato. */
function AvisosDoSistema({ avisos, hoje, v }: { avisos: EventoDoSistema[]; hoje: string; v: ReturnType<typeof vocabulario> }) {
  return (
    <section aria-label="Do sistema" className="flex flex-col gap-1">
      <h2 className="font-heading text-lg">
        Do sistema <span className="text-sm font-normal text-muted-foreground">próximos 30 dias</span>
      </h2>
      <ul className="divide-y rounded-2xl border bg-card px-4">
        {avisos.map((e) => (
          <li key={e.chave}>
            <Link href={e.href} className="flex items-start gap-3 py-3 hover:text-primary">
              <IconeEvento e={e} />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">
                  {rotuloEvento(e, v)} ({e.inquilino.split(" ")[0]})
                </span>
                <span className={cn("text-sm text-muted-foreground", e.data < hoje && "text-destructive")}>
                  {e.data < hoje
                    ? `${e.tipo === "REAJUSTE" ? "atrasado desde" : "terminou em"} ${formatarData(e.data)}`
                    : `${formatarData(e.data)} · ${distanciaEmDias(hoje, e.data)}`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
