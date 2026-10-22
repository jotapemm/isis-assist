import { CalendarClock, TrendingUp } from "lucide-react";
import { distanciaEmDias } from "@/lib/datas";
import { formatarData } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { AVISO_FIM_DIAS, AVISO_REAJUSTE_DIAS } from "../limites";

type Prazos = {
  status: "ATIVO" | "ENCERRADO";
  dataFim: string;
  proximoReajusteEm: string | null;
  diasParaFim: number | null;
  diasParaReajuste: number | null;
};

/** "Ativo", "Encerrado" ou "Prazo terminou" (o contrato segue valendo por prazo indeterminado). */
export function SeloContrato({ contrato, className }: { contrato: Prazos; className?: string }) {
  const [rotulo, estilo] =
    contrato.status === "ENCERRADO"
      ? ["Encerrado", "border-border bg-muted text-muted-foreground"]
      : contrato.diasParaFim !== null && contrato.diasParaFim < 0
        ? ["Prazo terminou", "border-reservado/50 bg-reservado/12 text-reservado"]
        : ["Ativo", "border-livre/45 bg-livre/10 text-livre"];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", estilo, className)}>
      {rotulo}
    </span>
  );
}

/** Lembretes de prazo: reajuste em até 30 dias e término em até 60. Vazio se não houver nada. */
export function AvisosDePrazo({ contrato, hoje, compacto = false }: { contrato: Prazos; hoje: string; compacto?: boolean }) {
  if (contrato.status !== "ATIVO") return null;
  const avisos: { icone: typeof TrendingUp; texto: string }[] = [];

  if (contrato.diasParaReajuste !== null && contrato.diasParaReajuste <= AVISO_REAJUSTE_DIAS && contrato.proximoReajusteEm) {
    avisos.push({
      icone: TrendingUp,
      texto:
        contrato.diasParaReajuste < 0
          ? `Reajuste atrasado: venceu ${distanciaEmDias(hoje, contrato.proximoReajusteEm)} (${formatarData(contrato.proximoReajusteEm)})`
          : `Reajuste ${distanciaEmDias(hoje, contrato.proximoReajusteEm)} (${formatarData(contrato.proximoReajusteEm)})`,
    });
  }
  if (contrato.diasParaFim !== null && contrato.diasParaFim <= AVISO_FIM_DIAS) {
    avisos.push({
      icone: CalendarClock,
      texto:
        contrato.diasParaFim < 0
          ? `O prazo terminou em ${formatarData(contrato.dataFim)}; segue por prazo indeterminado enquanto o inquilino ficar`
          : `Termina ${distanciaEmDias(hoje, contrato.dataFim)} (${formatarData(contrato.dataFim)})`,
    });
  }
  if (avisos.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-1.5", !compacto && "rounded-xl border border-reservado/40 bg-reservado/8 p-3")}>
      {avisos.map(({ icone: Icone, texto }) => (
        <li key={texto} className={cn("flex items-start gap-2", compacto ? "text-xs" : "text-sm")}>
          <Icone className={cn("shrink-0 text-reservado", compacto ? "mt-px size-3.5" : "mt-0.5 size-4")} aria-hidden="true" />
          <span>{texto}</span>
        </li>
      ))}
    </ul>
  );
}
