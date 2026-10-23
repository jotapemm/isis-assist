"use client";

import Link from "next/link";
import { useState } from "react";
import { BellPlus, FileSignature, HandCoins, type LucideIcon, Plus, ReceiptText, UserPlus, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type Acao = { href: string; rotulo: string; detalhe: string; icone: LucideIcon };

// Os destinos ganham as telas próprias nas fases de cada módulo (docs/PLANO.md §5).
const ACOES: Acao[] = [
  { href: "/financeiro", rotulo: "Registrar pagamento", detalhe: "Um inquilino pagou", icone: HandCoins },
  { href: "/contratos/novo", rotulo: "Novo contrato", detalhe: "Alugar um imóvel", icone: FileSignature },
  { href: "/financeiro?aba=despesas&nova=1", rotulo: "Lançar despesa", detalhe: "Conta de luz, IPTU, conserto…", icone: ReceiptText },
  { href: "/manutencoes", rotulo: "Abrir ordem de serviço", detalhe: "Algo precisa de conserto", icone: Wrench },
  { href: "/inquilinos/novo", rotulo: "Cadastrar inquilino", detalhe: "Nome, contatos e documentos", icone: UserPlus },
  { href: "/lembretes", rotulo: "Novo lembrete", detalhe: "Para não esquecer", icone: BellPlus },
];

/** Botão "+" flutuante do celular, logo acima do menu inferior. */
export function AcoesRapidasCelular() {
  const [aberto, setAberto] = useState(false);
  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger
        aria-label="Ações rápidas"
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-black/20 transition-transform active:scale-95 lg:hidden"
      >
        <Plus className="size-7" strokeWidth={2.4} />
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle>O que você quer fazer?</SheetTitle>
          <SheetDescription className="sr-only">Atalhos para as tarefas mais comuns</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col gap-1 px-2">
          {ACOES.map(({ href, rotulo, detalhe, icone: Icone }) => (
            <li key={rotulo}>
              <Link
                href={href}
                onClick={() => setAberto(false)}
                className="flex items-center gap-4 rounded-2xl px-3 py-3 hover:bg-muted active:bg-muted"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icone className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className="font-medium">{rotulo}</span>
                  <span className="text-sm text-muted-foreground">{detalhe}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

/** No desktop o mesmo menu fica no topo da barra lateral. */
export function AcoesRapidasDesktop() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full justify-start" size="lg">
          <Plus className="size-5" strokeWidth={2.4} />
          Novo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {ACOES.map(({ href, rotulo, icone: Icone }) => (
          <DropdownMenuItem key={rotulo} asChild className="h-10 gap-3">
            <Link href={href}>
              <Icone className="size-4 text-primary" />
              {rotulo}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
