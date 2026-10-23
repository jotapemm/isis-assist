import Link from "next/link";
import { Logotipo } from "@/components/marca";
import { formatarData } from "@/lib/formatar";
import { VERSAO_TERMOS } from "@/modulos/legal/versao";

/** Termos e Privacidade: abertos para todos (quem vai criar a conta lê antes de aceitar). */
export default function LayoutLegal({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16 sm:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <Link href="/" aria-label="Isis-Assist — início" className="mb-10 inline-block">
          <Logotipo />
        </Link>
        <article className="flex flex-col gap-6 leading-relaxed [&_h2]:mt-4 [&_h2]:font-heading [&_h2]:text-xl [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </article>
        <p className="mt-12 border-t pt-6 text-sm text-muted-foreground">
          Versão de {formatarData(VERSAO_TERMOS)} ·{" "}
          <Link href="/termos" className="underline-offset-4 hover:underline">
            Termos de Uso
          </Link>{" "}
          ·{" "}
          <Link href="/privacidade" className="underline-offset-4 hover:underline">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
}
