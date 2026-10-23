import Link from "next/link";
import { Wrench } from "lucide-react";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import type { Vocabulario } from "@/modulos/apartamentos/vocabulario";
import { abertaHa, emAberto, numeroOS, PRIORIDADE, type PrioridadeOS, SITUACAO_OS, type StatusOS } from "../regras";

const selo = "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-semibold";

export function SeloStatusOS({ status, className }: { status: StatusOS; className?: string }) {
  return <span className={cn(selo, SITUACAO_OS[status].classe, className)}>{SITUACAO_OS[status].rotulo}</span>;
}

/** Média e baixa não ganham selo na lista: só o que pede pressa chama atenção. */
export function SeloPrioridade({ prioridade, sempre = false, className }: { prioridade: PrioridadeOS; sempre?: boolean; className?: string }) {
  if (!sempre && (prioridade === "MEDIA" || prioridade === "BAIXA")) return null;
  return <span className={cn(selo, PRIORIDADE[prioridade].classe, className)}>{PRIORIDADE[prioridade].rotulo}</span>;
}

/** "Apto 203" ou "Área comum". */
export const ondeE = (v: Vocabulario, apartamento: { identificacao: string } | null) =>
  apartamento ? v.nome(apartamento.identificacao) : "Área comum";

type Resumo = {
  id: string;
  numero: number;
  titulo: string;
  prioridade: PrioridadeOS;
  status: StatusOS;
  custoEstimado: number | null;
  custoFinal: number | null;
  abertaEm: string;
  concluidaEm: string | null;
  apartamento: { identificacao: string } | null;
  prestador: { nome: string } | null;
};

/** Uma ordem na lista: o que é, onde, quem faz e há quanto tempo (ou quanto custou). */
export function CartaoOrdem({ os, v, hoje, mostrarOnde = true }: { os: Resumo; v: Vocabulario; hoje: string; mostrarOnde?: boolean }) {
  const aberta = emAberto(os.status);
  return (
    <Link href={`/manutencoes/${os.id}`} className="flex flex-col gap-1.5 rounded-2xl border bg-card p-4 transition-colors hover:bg-muted/50">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <Wrench className="size-3.5" aria-hidden="true" />
        <span className="font-mono tabular-nums">{numeroOS(os.numero)}</span>
        <span className="ml-auto flex gap-1.5">
          {aberta ? <SeloPrioridade prioridade={os.prioridade} /> : <SeloStatusOS status={os.status} />}
        </span>
      </span>
      <span className="font-medium leading-snug">{os.titulo}</span>
      <span className="text-sm text-muted-foreground">
        {[mostrarOnde && ondeE(v, os.apartamento), os.prestador?.nome].filter(Boolean).join(" · ")}
      </span>
      <span className="text-sm text-muted-foreground tabular-nums">
        {aberta
          ? `${abertaHa(os.abertaEm, hoje)}${os.custoEstimado ? ` · estimado ${formatarMoeda(os.custoEstimado)}` : ""}`
          : os.status === "CONCLUIDA"
            ? `concluída em ${formatarData(os.concluidaEm!)}${os.custoFinal ? ` · ${formatarMoeda(os.custoFinal)}` : " · sem custo"}`
            : "cancelada"}
      </span>
    </Link>
  );
}
