"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { arquivarInquilino, desarquivarInquilino } from "../acoes";

export function AcoesInquilino({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [arquivando, iniciar] = useTransition();
  const primeiroNome = nome.split(" ")[0];

  function arquivar() {
    iniciar(async () => {
      const r = await arquivarInquilino(id);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      router.push("/inquilinos");
      toast.success(`${primeiroNome} foi arquivado.`, {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await desarquivarInquilino(id);
            toast.success(`${primeiroNome} está de volta.`);
          },
        },
      });
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Mais ações">
            <MoreHorizontal className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild className="h-10 gap-3">
            <Link href={`/inquilinos/${id}/editar`}>
              <Pencil className="size-4" />
              Editar dados
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="h-10 gap-3 text-destructive focus:text-destructive" onSelect={() => setConfirmando(true)}>
            <Archive className="size-4" />
            Arquivar inquilino
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar {nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Sai da lista de inquilinos. Os dados e documentos continuam guardados para consulta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={arquivar} disabled={arquivando}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
