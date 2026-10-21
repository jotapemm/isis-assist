"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AvisoErro, CampoSenha, CampoTexto } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authClient, mensagemDeErro } from "@/lib/auth-client";
import { esquemaEntrar } from "../esquemas";

/** Só aceita voltar para um caminho interno — nunca para outro site. */
function destinoSeguro() {
  const voltar = new URLSearchParams(window.location.search).get("voltar");
  return voltar?.startsWith("/") && !voltar.startsWith("//") ? voltar : "/";
}

export function FormEntrar() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof esquemaEntrar>>({
    resolver: zodResolver(esquemaEntrar),
    defaultValues: { email: "", senha: "" },
  });

  async function entrar(dados: z.infer<typeof esquemaEntrar>) {
    setErro(null);
    const { error } = await authClient.signIn.email({ email: dados.email, password: dados.senha, rememberMe: true });
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    router.replace(destinoSeguro());
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(entrar)} noValidate>
      <FieldGroup>
        <CampoTexto
          control={form.control}
          name="email"
          rotulo="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoFocus
        />
        <CampoSenha control={form.control} name="senha" rotulo="Senha" autoComplete="current-password" />
        <AvisoErro mensagem={erro} />
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </FieldGroup>

      <div className="mt-6 flex flex-col items-center gap-3 text-sm">
        <Link href="/esqueci-a-senha" className="font-medium text-primary underline-offset-4 hover:underline">
          Esqueci a senha
        </Link>
        <p className="text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/criar-conta" className="font-medium text-primary underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </form>
  );
}
