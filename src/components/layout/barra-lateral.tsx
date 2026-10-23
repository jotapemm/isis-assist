"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logotipo } from "@/components/marca";
import { cn } from "@/lib/utils";
import { AcoesRapidasDesktop } from "./acoes-rapidas";
import type { TipoResidencial } from "@/modulos/apartamentos/vocabulario";
import { estaAtivo, type ItemNavegacao, NAVEGACAO_SECUNDARIA, navegacaoPara } from "./navegacao";
import { useTipoResidencial } from "./tipo-lembrado";

/** Navegação do desktop. No celular quem faz esse papel é o MenuInferior. */
export function BarraLateral({ rodape, navegacao }: { rodape: React.ReactNode; navegacao: React.ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-sidebar-border bg-sidebar px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 px-2" aria-label="Isis-Assist — início">
        <Logotipo />
      </Link>

      <AcoesRapidasDesktop />

      {navegacao}

      <div className="border-t border-sidebar-border pt-4">{rodape}</div>
    </aside>
  );
}

/**
 * A lista sai pronta na moldura (sem item marcado, com o tipo lembrado no aparelho) e acende o item
 * atual com o tipo verdadeiro quando o endereço e a conta são lidos (layout, dentro de <Suspense>).
 */
export function ListaLateralAtiva({ tipo }: { tipo: TipoResidencial | null }) {
  return <ListaLateral caminho={usePathname()} tipo={tipo} />;
}

export function ListaLateral({ caminho, tipo }: { caminho: string | null; tipo: TipoResidencial | null }) {
  const itens = navegacaoPara(useTipoResidencial(tipo));
  const ativo = (href: string) => caminho !== null && estaAtivo(href, caminho);
  return (
    <nav aria-label="Principal" className="mt-6 flex flex-1 flex-col gap-1">
      {itens.map((item) => (
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
