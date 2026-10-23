"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro } from "@/components/campos/campos";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, mensagemDeErro } from "@/lib/auth-client";
import { Secao } from "./secao";

const PALAVRA = "EXCLUIR";

/** Links dos documentos e a exclusão da conta (LGPD, art. 18, VI). */
export function PrivacidadeDaConta() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [palavra, setPalavra] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  async function excluir(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setExcluindo(true);
    const { error } = await authClient.deleteUser({ password: senha });
    if (error) {
      setExcluindo(false);
      setErro(mensagemDeErro(error));
      return;
    }
    toast.success("Conta excluída. Seus dados e os do residencial foram apagados.");
    // refresh: nada da conta antiga fica no cache de telas do navegador.
    router.replace("/entrar");
    router.refresh();
  }

  return (
    <Secao
      titulo="Privacidade e conta"
      descricao="Como o Isis-Assist cuida dos seus dados e dos dados dos inquilinos, e como sair de vez."
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm">
          Leia os{" "}
          <Link href="/termos" target="_blank" className="font-medium text-primary underline-offset-4 hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-medium text-primary underline-offset-4 hover:underline">
            Política de Privacidade
          </Link>
          . Pedidos de inquilinos (cópia ou apagamento dos dados) se atendem na página de cada um, no menu ⋯.
        </p>

        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 p-4">
          <p className="text-sm">
            <strong>Excluir minha conta</strong> apaga você, o residencial, os imóveis, inquilinos, contratos, recibos,
            despesas e todos os arquivos enviados. Não dá para desfazer.
          </p>
          <Button variant="outline" className="self-start border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setAberto(true)}>
            <Trash2 className="size-4" />
            Excluir minha conta
          </Button>
        </div>
      </div>

      <AlertDialog
        open={aberto}
        onOpenChange={(abrir) => {
          setAberto(abrir);
          if (!abrir) {
            setSenha("");
            setPalavra("");
            setErro(null);
          }
        }}
      >
        <AlertDialogContent>
          <form method="post" onSubmit={excluir} className="flex flex-col gap-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir a conta de vez?</AlertDialogTitle>
              <AlertDialogDescription>
                Tudo some: residencial, inquilinos, contratos, financeiro e arquivos. Se precisar dos recibos para o imposto de
                renda, guarde os PDFs antes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Sua senha
              <Input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Para confirmar, digite {PALAVRA}
              <Input value={palavra} onChange={(e) => setPalavra(e.target.value)} autoCapitalize="characters" autoComplete="off" />
            </label>
            <AvisoErro mensagem={erro} />
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
              <Button type="submit" variant="destructive" disabled={excluindo || !senha || palavra.trim().toUpperCase() !== PALAVRA}>
                {excluindo ? "Excluindo…" : "Excluir conta"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </Secao>
  );
}
