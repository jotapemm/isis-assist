import Link from "next/link";
import { Suspense } from "react";
import { AcoesRapidasCelular } from "@/components/layout/acoes-rapidas";
import { BarraLateral } from "@/components/layout/barra-lateral";
import { MenuInferior } from "@/components/layout/menu-inferior";
import { BotaoSair } from "@/components/layout/menu-usuario";
import { UsuarioAtual, UsuarioAtualCarregando } from "@/components/layout/usuario-atual";
import { Logotipo } from "@/components/marca";

/**
 * Casca da área logada. Tudo aqui é estático (sai no "static shell" e aparece na hora);
 * só o bloco do usuário lê a sessão, atrás de um <Suspense>.
 */
export default function LayoutApp({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <BarraLateral
        rodape={
          <Suspense fallback={<UsuarioAtualCarregando />}>
            <UsuarioAtual />
          </Suspense>
        }
      />

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
          <Link href="/" className="flex h-16 items-center" aria-label="Isis-Assist — início">
            <Logotipo />
          </Link>
          <Suspense fallback={<UsuarioAtualCarregando compacto />}>
            <UsuarioAtual compacto />
          </Suspense>
        </header>

        <main className="flex-1 px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-10 lg:pb-14">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <MenuInferior sair={<BotaoSair />} />
      <AcoesRapidasCelular />
    </div>
  );
}
