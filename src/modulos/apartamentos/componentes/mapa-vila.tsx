import Link from "next/link";
import { cn } from "@/lib/utils";
import { STATUS, type StatusApartamento } from "../status";
import type { JanelaApto } from "./mapa-fachada";
import { MapaFachada } from "./mapa-fachada";
import type { TipoResidencial } from "../vocabulario";

/**
 * Residencial de casas: cada casa com telhado na cor do status, lado a lado, e a rua embaixo com a
 * placa e o portão — o mesmo jeito de olhar da fachada do prédio, só que deitado.
 */
export function MapaVila({
  casas,
  residencial,
  destaque = null,
}: {
  casas: JanelaApto[];
  residencial: string;
  destaque?: StatusApartamento | null;
}) {
  return (
    <figure aria-label={`Mapa do ${residencial}`} className="flex flex-col">
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.25rem,1fr))] gap-x-2 gap-y-4 px-1 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] sm:gap-x-3">
        {casas.map((casa) => (
          <li key={casa.id}>
            <Casinha casa={casa} apagada={destaque !== null && casa.status !== destaque} />
          </li>
        ))}
      </ul>

      {/* A rua, com a placa e o portão do residencial */}
      <div className="relative mt-5 flex items-center justify-center gap-3 rounded-md bg-secondary py-3" aria-hidden="true">
        <span className="absolute inset-x-4 top-1/2 border-t-2 border-dashed border-muted-foreground/35" />
        <span className="relative max-w-[60%] truncate rounded-md border border-latao/50 bg-latao-suave px-3 py-1 font-heading text-sm text-latao">
          {residencial}
        </span>
        <span className="relative flex h-7 w-12 gap-0.5 rounded-sm border-2 border-latao bg-card p-0.5">
          <span className="flex-1 rounded-[1px] bg-latao/30" />
          <span className="flex-1 rounded-[1px] bg-latao/30" />
        </span>
      </div>
    </figure>
  );
}

function Casinha({ casa, apagada }: { casa: JanelaApto; apagada: boolean }) {
  const info = STATUS[casa.status];
  const Icone = info.icone;
  return (
    <Link
      href={`/apartamentos/${casa.id}`}
      aria-label={`Casa ${casa.identificacao}, ${info.rotulo}${casa.inquilino ? `, ${casa.inquilino}` : ""}`}
      className={cn(
        "group flex flex-col rounded-lg outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/60",
        apagada && "opacity-25",
      )}
    >
      {/* telhado */}
      <span aria-hidden="true" className={cn("mx-auto block h-5 w-[92%] opacity-85 [clip-path:polygon(50%_0,100%_100%,0_100%)] sm:h-6", info.ponto)} />
      <span
        className={cn(
          "flex min-h-16 min-w-0 flex-col justify-between gap-1 rounded-b-lg border-2 border-t-0 px-2 py-1.5 transition-shadow group-hover:shadow-md sm:min-h-[4.5rem]",
          info.fundo,
          info.borda,
        )}
      >
        <span className="truncate font-mono text-base leading-none font-bold tabular-nums sm:text-lg">{casa.identificacao}</span>
        <span className={cn("flex min-w-0 items-center gap-1 text-xs font-semibold", info.texto)}>
          <Icone className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden truncate sm:inline">{casa.inquilino ? casa.inquilino.split(" ")[0] : info.rotulo}</span>
        </span>
      </span>
    </Link>
  );
}

/** Desenho certo para o tipo do residencial: fachada do prédio ou rua de casas. */
export function MapaResidencial({
  tipo,
  aptos,
  residencial,
  destaque,
}: {
  tipo: TipoResidencial;
  aptos: JanelaApto[];
  residencial: string;
  destaque?: StatusApartamento | null;
}) {
  return tipo === "CASAS" ? (
    <MapaVila casas={aptos} residencial={residencial} destaque={destaque} />
  ) : (
    <MapaFachada aptos={aptos} residencial={residencial} destaque={destaque} />
  );
}
