import { Button } from "@/components/ui/button";

/** Um bloco da tela de Configurações: título, explicação, campos e o botão de salvar daquele bloco. */
export function Secao({
  titulo,
  descricao,
  children,
  onSubmit,
  podeSalvar,
  salvando,
  rotuloSalvar = "Salvar",
}: {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  podeSalvar?: boolean;
  salvando?: boolean;
  rotuloSalvar?: string;
}) {
  const corpo = (
    <>
      <div className="lg:pr-6">
        <h2 className="font-heading text-xl">{titulo}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      </div>
      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        {children}
        {onSubmit && (
          <div className="mt-6 flex justify-end border-t pt-4">
            <Button type="submit" disabled={!podeSalvar || salvando} className="w-full sm:w-auto">
              {salvando ? "Salvando…" : rotuloSalvar}
            </Button>
          </div>
        )}
      </div>
    </>
  );

  const classe = "grid gap-4 border-b py-8 first:pt-0 last:border-b-0 lg:grid-cols-[18rem_minmax(0,1fr)]";
  return onSubmit ? (
    <form onSubmit={onSubmit} noValidate className={classe}>
      {corpo}
    </form>
  ) : (
    <section className={classe}>{corpo}</section>
  );
}
