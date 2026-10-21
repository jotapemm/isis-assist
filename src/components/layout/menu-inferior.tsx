"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { estaAtivo, MENU_INFERIOR, NAVEGACAO, NAVEGACAO_SECUNDARIA } from "./navegacao";
import { SeletorTema } from "./seletor-tema";

/** Menu fixo no rodapé do celular: quatro atalhos + "Mais". */
export function MenuInferior({ sair }: { sair: React.ReactNode }) {
  const caminho = usePathname();
  const [maisAberto, setMaisAberto] = useState(false);
  const fixos = NAVEGACAO.filter((item) => MENU_INFERIOR.includes(item.href));
  const outros = [...NAVEGACAO.filter((item) => !MENU_INFERIOR.includes(item.href)), ...NAVEGACAO_SECUNDARIA];
  const algumOutroAtivo = outros.some((item) => estaAtivo(item.href, caminho));

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-card/85 lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {fixos.map((item) => {
          const ativo = estaAtivo(item.href, caminho);
          const Icone = item.icone;
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={ativo ? "page" : undefined} className="group flex h-16 flex-col items-center justify-center gap-1">
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    ativo ? "bg-secondary text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icone className="size-[1.35rem]" />
                </span>
                <span className={cn("text-[0.72rem] leading-none", ativo ? "font-bold text-foreground" : "text-muted-foreground")}>
                  {item.curto ?? item.rotulo}
                </span>
              </Link>
            </li>
          );
        })}

        <li>
          <Sheet open={maisAberto} onOpenChange={setMaisAberto}>
            <SheetTrigger className="flex h-16 w-full flex-col items-center justify-center gap-1">
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full",
                  algumOutroAtivo ? "bg-secondary text-primary" : "text-muted-foreground",
                )}
              >
                <Menu className="size-[1.35rem]" />
              </span>
              <span className={cn("text-[0.72rem] leading-none", algumOutroAtivo ? "font-bold" : "text-muted-foreground")}>Mais</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <SheetHeader>
                <SheetTitle>Mais opções</SheetTitle>
                <SheetDescription className="sr-only">Outras áreas do Isis-Assist</SheetDescription>
              </SheetHeader>
              <ul className="grid grid-cols-3 gap-2 px-4">
                {outros.map((item) => {
                  const Icone = item.icone;
                  const ativo = estaAtivo(item.href, caminho);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMaisAberto(false)}
                        className={cn(
                          "flex h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-background px-2 text-center text-sm font-medium",
                          ativo && "border-primary/40 bg-secondary",
                        )}
                      >
                        <Icone className="size-6 text-primary" />
                        {item.rotulo}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mx-4 mt-2 flex items-center justify-between gap-3 rounded-2xl border bg-background p-3">
                <span className="text-sm font-medium">Aparência</span>
                <SeletorTema />
              </div>
              <div className="px-4">{sair}</div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
