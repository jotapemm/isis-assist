import { Fachada } from "@/components/comum/fachada";
import { Logotipo } from "@/components/marca";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden flex-col overflow-hidden bg-[#2c3fa3] p-10 text-white lg:flex xl:p-14">
        <Logotipo sobreEscuro />
        <div className="my-auto w-full max-w-[22rem] self-center py-10">
          <Fachada />
        </div>
        <p className="max-w-md font-heading text-[2rem] leading-tight text-balance">
          Aluguéis, contratos e recebimentos do seu residencial. Sem planilha.
        </p>
        {/* luz do latão vindo de baixo */}
        <div className="pointer-events-none absolute -bottom-40 left-1/2 size-[32rem] -translate-x-1/2 rounded-full bg-[#d9ae5a]/15 blur-3xl" />
      </aside>

      <main className="flex flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 sm:px-8 lg:justify-center">
        <div className="mx-auto w-full max-w-sm">
          <Logotipo className="mb-10 lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
