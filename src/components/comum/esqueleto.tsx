import { Skeleton } from "@/components/ui/skeleton";

/** Fallback dos <Suspense> das páginas: aparece na hora enquanto os dados chegam. */
export function EsqueletoCartoes() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="h-36 rounded-2xl" />
      <Skeleton className="hidden h-36 rounded-2xl lg:block" />
    </div>
  );
}

export function EsqueletoFormulario() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export function EsqueletoBloco({ className = "h-80" }: { className?: string }) {
  return <Skeleton aria-busy="true" aria-label="Carregando" className={`${className} w-full rounded-3xl`} />;
}
