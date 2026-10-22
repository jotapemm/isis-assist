"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Logotipo } from "@/components/marca";
import { cn } from "@/lib/utils";
import { AcoesRapidasDesktop } from "./acoes-rapidas";
import { estaAtivo, type ItemNavegacao, NAVEGACAO, NAVEGACAO_SECUNDARIA } from "./navegacao";

/** Navegação do desktop. No celular quem faz esse papel é o MenuInferior. */
export function BarraLateral({ rodape }: { rodape: React.ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 px-2" aria-label="Isis-Assist — início">
        <Logotipo />
      </Link>

      <AcoesRapidasDesktop />

      {/* O endereço atual só existe na hora do acesso: a lista sai pronta sem marcação e acende o item em seguida. */}
      <Suspense fallback={<ListaLateral caminho={null} />}>
        <ListaLateralAtiva />
      </Suspense>

      <div className="border-t border-sidebar-border pt-4">{rodape}</div>
    </aside>
  );
}

function ListaLateralAtiva() {
  return <ListaLateral caminho={usePathname()} />;
}

function ListaLateral({ caminho }: { caminho: string | null }) {
  const ativo = (href: string) => caminho !== null && estaAtivo(href, caminho);
  return (
    <nav aria-label="Principal" className="mt-6 flex flex-1 flex-col gap-1">
      {NAVEGACAO.map((item) => (
        <ItemBarra key={item.href} item={item} ativo={ativo(item.href)} />
      ))}
      <div className="my-3 h-px bg-sidebar-border" />
      {NAVEGACAO_SECUNDARIA.map((item) => (
        <ItemBarra key={item.href} item={item} ativo={ativo(item.href)} />
      ))}
    </nav>
  );
}

function ItemBarra({ item, ativo }: { item: ItemNavegacao; ativo: boolean }) {
  const Icone = item.icone;
  return (
    <Link
      href={item.href}
      aria-current={ativo ? "page" : undefined}
      className={cn(
        "group relative flex h-11 items-center gap-3 rounded-lg px-3 text-[0.95rem] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
        ativo && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      {/* filete de latão marcando onde a pessoa está */}
      <span
        className={cn(
          "absolute top-2.5 bottom-2.5 -left-4 w-1 rounded-r-full bg-latao opacity-0 transition-opacity",
          ativo && "opacity-100",
        )}
      />
      <Icone className={cn("size-5", ativo ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      {item.rotulo}
    </Link>
  );
}
