import Link from "next/link";
import { cn } from "@/lib/utils";
import { nomeAndar, STATUS, type StatusApartamento } from "../status";

export type JanelaApto = { id: string; identificacao: string; andar: number | null; status: StatusApartamento };

/** Agrupa por andar, de cima para baixo — como se olha para o prédio. "Sem andar" fica por último. */
function andaresDeCimaParaBaixo(aptos: JanelaApto[]) {
  const grupos = new Map<number | null, JanelaApto[]>();
  for (const apto of aptos) grupos.set(apto.andar, [...(grupos.get(apto.andar) ?? []), apto]);
  return [...grupos.entries()].sort(([a], [b]) => (b ?? -Infinity) - (a ?? -Infinity));
}

/**
 * O residencial desenhado como a fachada: laje no alto, um andar por linha, cada apartamento uma
 * janela com a cor do status, e a porta de latão com a placa do prédio embaixo.
 * `destaque` apaga as janelas dos outros status sem tirar nenhuma do lugar (o prédio continua inteiro).
 */
export function MapaFachada({
  aptos,
  residencial,
  destaque = null,
}: {
  aptos: JanelaApto[];
  residencial: string;
  destaque?: StatusApartamento | null;
}) {
  const andares = andaresDeCimaParaBaixo(aptos);
  const colunas = Math.max(...andares.map(([, lista]) => lista.length));

  return (
    <figure aria-label={`Fachada do ${residencial}`} className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="mx-auto w-full min-w-fit" style={{ maxWidth: `${colunas * 8.5 + 8}rem` }}>
        <div className="h-3 rounded-t-lg bg-secondary" aria-hidden="true" />
        <div className="mx-2 border-x-2 border-border bg-card px-2 sm:mx-3 sm:px-4">
          {andares.map(([andar, lista]) => (
            <div key={andar ?? "sem"} className="flex items-stretch gap-2 border-b border-border/70 py-2.5 sm:gap-4 sm:py-3">
              <span className="flex w-9 shrink-0 items-center justify-end text-right text-xs leading-tight font-medium text-muted-foreground sm:w-16">
                <span className="hidden sm:inline">{nomeAndar(andar)}</span>
                <span className="sm:hidden" aria-hidden="true">
                  {andar === null ? "—" : andar === 0 ? "T" : `${andar}º`}
                </span>
              </span>
              <ul
                className="grid flex-1 gap-1.5 sm:gap-2.5"
                style={{ gridTemplateColumns: `repeat(${colunas}, minmax(3.4rem, 1fr))` }}
                aria-label={nomeAndar(andar)}
              >
                {lista.map((apto) => (
                  <li key={apto.id}>
                    <Janela apto={apto} apagada={destaque !== null && apto.status !== destaque} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Entrada do prédio */}
          <div className="flex items-end justify-center gap-3 pt-4" aria-hidden="true">
            <span className="mb-2 max-w-[60%] truncate rounded-md border border-latao/50 bg-latao-suave px-3 py-1 font-heading text-sm text-latao">
              {residencial}
            </span>
            <span className="relative h-14 w-11 rounded-t-full bg-latao">
              <span className="absolute top-8 right-2 size-1.5 rounded-full bg-card" />
            </span>
          </div>
        </div>
        <div className="h-2.5 rounded-b-md bg-secondary" aria-hidden="true" />
      </div>
    </figure>
  );
}

function Janela({ apto, apagada }: { apto: JanelaApto; apagada: boolean }) {
  const info = STATUS[apto.status];
  const Icone = info.icone;
  return (
    <Link
      href={`/apartamentos/${apto.id}`}
      aria-label={`Apartamento ${apto.identificacao}, ${info.rotulo}`}
      className={cn(
        "flex h-full min-h-16 min-w-0 flex-col justify-between gap-1 rounded-lg border-2 px-2 py-1.5 transition-[opacity,box-shadow] outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/60 sm:min-h-20 sm:px-2.5 sm:py-2",
        info.fundo,
        info.borda,
        apagada && "opacity-25",
      )}
    >
      <span className="truncate font-mono text-base leading-none font-bold tracking-tight tabular-nums sm:text-lg" title={apto.identificacao}>
        {apto.identificacao}
      </span>
      <span className={cn("flex min-w-0 items-center gap-1 text-xs font-semibold", info.texto)}>
        <Icone className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden truncate sm:inline">{info.rotulo}</span>
      </span>
    </Link>
  );
}
