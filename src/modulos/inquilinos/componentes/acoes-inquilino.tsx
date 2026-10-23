"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Download, MoreHorizontal, Pencil, ShieldX } from "lucide-react";
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
import { formatarData } from "@/lib/formatar";
import { apagarDadosDoInquilino, arquivarInquilino, desarquivarInquilino } from "../acoes";

type Props = { id: string; nome: string; arquivado: boolean; apagado: boolean; morandoAgora: boolean };

export function AcoesInquilino({ id, nome, arquivado, apagado, morandoAgora }: Props) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState<"arquivar" | "apagar" | null>(null);
  const [salvando, iniciar] = useTransition();
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

  function trazerDeVolta() {
    iniciar(async () => {
      await desarquivarInquilino(id);
      toast.success(`${primeiroNome} está de volta na lista.`);
    });
  }

  function apagar() {
    iniciar(async () => {
      const r = await apagarDadosDoInquilino(id);
      setConfirmando(null);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success(
        r.dados.guardarAte
          ? `Dados apagados. Nome e CPF ficam até ${formatarData(r.dados.guardarAte)} por causa do imposto de renda e depois saem sozinhos.`
          : "Dados apagados.",
        { duration: 10_000 },
      );
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
        <DropdownMenuContent align="end" className="w-64">
          {!arquivado && (
            <DropdownMenuItem asChild className="h-10 gap-3">
              <Link href={`/inquilinos/${id}/editar`}>
                <Pencil className="size-4" />
                Editar dados
              </Link>
            </DropdownMenuItem>
          )}
          {arquivado && !apagado && (
            <DropdownMenuItem className="h-10 gap-3" disabled={salvando} onSelect={trazerDeVolta}>
              <ArchiveRestore className="size-4" />
              Trazer de volta para a lista
            </DropdownMenuItem>
          )}
          {/* download nativo: o arquivo vem da rota com Content-Disposition */}
          <DropdownMenuItem asChild className="h-10 gap-3">
            <a href={`/api/inquilinos/${id}/dados`} download>
              <Download className="size-4" />
              Baixar os dados (LGPD)
            </a>
          </DropdownMenuItem>
          {(!arquivado || !apagado) && <DropdownMenuSeparator />}
          {!arquivado && (
            <DropdownMenuItem className="h-10 gap-3" onSelect={() => setConfirmando("arquivar")}>
              <Archive className="size-4" />
              Arquivar inquilino
            </DropdownMenuItem>
          )}
          {!apagado && (
            <DropdownMenuItem
              className="h-10 gap-3 text-destructive focus:text-destructive"
              onSelect={() => (morandoAgora ? toast.error("Tem contrato ativo. Encerre o contrato antes de apagar os dados.") : setConfirmando("apagar"))}
            >
              <ShieldX className="size-4" />
              Apagar dados pessoais
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmando === "arquivar"} onOpenChange={(aberto) => !aberto && setConfirmando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar {nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              Sai da lista de inquilinos e vai para os arquivados. Os dados e documentos continuam guardados para consulta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={arquivar} disabled={salvando}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmando === "apagar"} onOpenChange={(aberto) => !aberto && setConfirmando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar os dados pessoais de {primeiroNome}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p>
                  Use quando a pessoa pedir (é um direito dela pela LGPD). Antes, baixe os dados se ela quiser uma cópia.
                </p>
                <p>
                  <strong className="text-foreground">Sai agora:</strong> telefone, e-mail, RG, nascimento, renda, contato de
                  emergência, fiador, observações e documentos enviados.
                </p>
                <p>
                  <strong className="text-foreground">Fica por um tempo:</strong> nome e CPF, porque estão nos recibos e no seu
                  imposto de renda. Saem sozinhos 5 anos depois da declaração, junto com o contrato assinado e os comprovantes.
                </p>
                <p>Não dá para desfazer.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                apagar();
              }}
              disabled={salvando}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {salvando ? "Apagando…" : "Apagar dados"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
