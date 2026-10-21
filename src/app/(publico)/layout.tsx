import { Fachada } from "@/components/comum/fachada";
import { Logotipo } from "@/components/marca";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="hidden flex-col overflow-hidden bg-[#2c3fa3] px-10 pt-10 text-white lg:flex xl:px-14 xl:pt-14">
        <Logotipo sobreEscuro />
        <p className="mt-5 max-w-sm text-lg leading-snug text-white/75">
          Apartamentos, inquilinos e aluguéis do residencial.
        </p>
        {/* O prédio fica de pé na calçada, no rodapé do painel. */}
        <div className="mt-auto w-full max-w-[24rem] self-center pt-12">
          <Fachada className="block" />
        </div>
        <div className="-mx-10 h-4 shrink-0 bg-[#24358f] xl:-mx-14" />
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
