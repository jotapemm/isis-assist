import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Link "← Apartamentos" acima do título das páginas de detalhe. */
export function VoltarPara({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link
      href={href}
      className="-ml-1 mb-3 inline-flex h-9 items-center gap-1 rounded-lg pr-2 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ChevronLeft className="size-4" aria-hidden="true" />
      {rotulo}
    </Link>
  );
}

/** Cartão de uma parte da página de detalhe ("Fotos", "Contato", "Fiador"…). */
export function Bloco({
  titulo,
  acoes,
  children,
  className,
}: {
  titulo: string;
  acoes?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg">{titulo}</h2>
        {acoes}
      </header>
      {children}
    </section>
  );
}

/** Lista de "rótulo: valor" (dados do apto, contato do inquilino). Itens vazios não aparecem. */
export function Dados({ itens }: { itens: [rotulo: string, valor: React.ReactNode][] }) {
  const preenchidos = itens.filter(([, valor]) => valor !== null && valor !== undefined && valor !== "");
  if (preenchidos.length === 0) return <p className="text-sm text-muted-foreground">Nada preenchido ainda.</p>;
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {preenchidos.map(([rotulo, valor]) => (
        <div key={rotulo} className="flex flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{rotulo}</dt>
          <dd className="break-words">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
