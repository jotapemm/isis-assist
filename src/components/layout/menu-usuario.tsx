"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { SeletorTema } from "./seletor-tema";

type Usuario = { nome: string; email: string; residencial: string | null };

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes.at(-1)![0] : "")).toUpperCase();
}

function useSair() {
  const router = useRouter();
  const [saindo, setSaindo] = useState(false);
  async function sair() {
    setSaindo(true);
    await authClient.signOut();
    router.replace("/entrar");
    router.refresh();
  }
  return { sair, saindo };
}

export function Avatar({ nome, className }: { nome: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-latao-suave text-sm font-bold text-latao ring-1 ring-latao/30",
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  );
}

/** Rodapé da barra lateral (desktop): quem está usando e em qual residencial. */
export function MenuUsuario({ usuario, compacto = false }: { usuario: Usuario; compacto?: boolean }) {
  const { sair, saindo } = useSair();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          compacto ? "p-0.5" : "w-full p-2 hover:bg-sidebar-accent",
        )}
        aria-label="Sua conta"
      >
        <Avatar nome={usuario.nome} />
        {!compacto && (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{usuario.nome}</span>
              <span className="truncate text-sm text-muted-foreground">{usuario.residencial ?? usuario.email}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compacto ? "end" : "start"} side={compacto ? "bottom" : "top"} className="w-72">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-sm font-medium text-foreground">{usuario.nome}</span>
          <span className="text-xs font-normal text-muted-foreground">{usuario.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm">Aparência</span>
          <SeletorTema />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="h-10 gap-3">
          <Link href="/configuracoes">
            <Settings className="size-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="h-10 gap-3" disabled={saindo} onSelect={sair}>
          <LogOut className="size-4" />
          {saindo ? "Saindo…" : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Botão "Sair" grande, para o menu "Mais" do celular. */
export function BotaoSair() {
  const { sair, saindo } = useSair();
  return (
    <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={sair} disabled={saindo}>
      <LogOut className="size-5" />
      {saindo ? "Saindo…" : "Sair da conta"}
    </Button>
  );
}
