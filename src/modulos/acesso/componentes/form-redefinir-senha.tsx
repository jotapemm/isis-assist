"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { AvisoErro, CampoSenha } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authClient, mensagemDeErro } from "@/lib/auth-client";
import { esquemaNovaSenha } from "../esquemas";

/** `token` nulo = link vencido, já usado ou aberto sem token. */
export function FormRedefinirSenha({ token }: { token: string | null }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof esquemaNovaSenha>>({
    resolver: zodResolver(esquemaNovaSenha),
    defaultValues: { senha: "", confirmacao: "" },
  });

  async function salvar({ senha }: z.infer<typeof esquemaNovaSenha>) {
    if (!token) return;
    setErro(null);
    const { error } = await authClient.resetPassword({ newPassword: senha, token });
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    toast.success("Senha nova salva. Entre com ela.");
    router.replace("/entrar");
  }

  if (token === null) {
    return (
      <div className="rounded-xl border bg-card p-5" role="alert">
        <p className="font-medium">Este link não vale mais</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ele expira em 1 hora e só pode ser usado uma vez. Peça um novo para continuar.
        </p>
        <Button asChild className="mt-5 w-full">
          <Link href="/esqueci-a-senha">Pedir novo link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={form.handleSubmit(salvar)} noValidate>
      <FieldGroup>
        <CampoSenha
          control={form.control}
          name="senha"
          rotulo="Nova senha"
          descricao="Pelo menos 8 caracteres."
          autoComplete="new-password"
          autoFocus
        />
        <CampoSenha control={form.control} name="confirmacao" rotulo="Repita a nova senha" autoComplete="new-password" />
        <AvisoErro mensagem={erro} />
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </FieldGroup>
    </form>
  );
}
