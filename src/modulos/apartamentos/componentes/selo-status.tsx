import { cn } from "@/lib/utils";
import { STATUS, type StatusApartamento } from "../status";

export function SeloStatus({ status, className }: { status: StatusApartamento; className?: string }) {
  const info = STATUS[status];
  const Icone = info.icone;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-semibold",
        info.fundo,
        info.borda,
        info.texto,
        className,
      )}
    >
      <Icone className="size-4" aria-hidden="true" />
      {info.rotulo}
    </span>
  );
}
