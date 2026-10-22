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
import { arquivarApartamento, desarquivarApartamento } from "../acoes";

export function AcoesApartamento({ id, identificacao }: { id: string; identificacao: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [arquivando, iniciar] = useTransition();

  function arquivar() {
    iniciar(async () => {
      const r = await arquivarApartamento(id);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      router.push("/apartamentos");
      toast.success(`Apto ${identificacao} arquivado.`, {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await desarquivarApartamento(id);
            toast.success(`Apto ${identificacao} de volta.`);
          },
        },
      });
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href={`/apartamentos/${id}/editar`}>
            <Pencil className="size-4" />
            Editar
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Mais ações">
              <MoreHorizontal className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild className="h-10 gap-3">
              <Link href={`/apartamentos/${id}/editar`}>
                <Pencil className="size-4" />
                Editar dados
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="h-10 gap-3 text-destructive focus:text-destructive" onSelect={() => setConfirmando(true)}>
              <Archive className="size-4" />
              Arquivar apartamento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar o apto {identificacao}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele sai da fachada e das listas. As fotos e o histórico continuam guardados.
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
