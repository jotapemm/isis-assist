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
import { type TipoResidencial, vocabulario } from "../vocabulario";

export function AcoesApartamento({
  id,
  identificacao,
  tipo,
}: {
  id: string;
  identificacao: string;
  tipo: TipoResidencial;
}) {
  const v = vocabulario(tipo);
  const nome = v.nome(identificacao);
  const arquivado = v.o === "a" ? "arquivada" : "arquivado";
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
      toast.success(`${nome} ${arquivado}.`, {
        action: {
          label: "Desfazer",
          onClick: async () => {
            await desarquivarApartamento(id);
            toast.success(`${nome} de volta.`);
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
            <DropdownMenuItem
              className="h-10 gap-3 text-destructive focus:text-destructive"
              onSelect={() => setConfirmando(true)}
            >
              <Archive className="size-4" />
              Arquivar {v.singular}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Arquivar {v.o} {v.nomeMinusculo(identificacao)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {v.o === "a" ? "Ela" : "Ele"} sai do mapa e das listas. As fotos e o histórico continuam guardados.
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
