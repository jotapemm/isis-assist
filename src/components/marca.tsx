import { cn } from "@/lib/utils";

/** Símbolo: uma porta em arco, em latão, sobre lápis-lazúli. Cores fixas — é a marca, não muda com o tema. */
export function MarcaIsis({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9 shrink-0", className)} aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="#2c3fa3" />
      <path d="M12.5 31.5V19.5a7.5 7.5 0 0 1 15 0v12z" fill="#d9ae5a" />
      <path d="M12.5 31.5h15" stroke="#f3e6c8" strokeWidth="1.2" />
      <circle cx="23.6" cy="25.2" r="1.35" fill="#2c3fa3" />
    </svg>
  );
}

export function Logotipo({
  className,
  compacto = false,
  sobreEscuro = false,
}: {
  className?: string;
  compacto?: boolean;
  /** Sobre o painel de lápis-lazúli: o símbolo ganha contorno e o "assist" usa o latão claro. */
  sobreEscuro?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="Isis-Assist">
      <MarcaIsis className={cn(sobreEscuro && "rounded-[11px] ring-1 ring-white/25")} />
      {!compacto && (
        <span className="flex items-baseline gap-1 leading-none" aria-hidden="true">
          <span className="font-heading text-[1.4rem] tracking-tight">Isis</span>
          <span
            className={cn(
              "text-[0.7rem] font-bold tracking-[0.18em] uppercase",
              sobreEscuro ? "text-[#e7c37a]" : "text-latao",
            )}
          >
            assist
          </span>
        </span>
      )}
    </span>
  );
}
