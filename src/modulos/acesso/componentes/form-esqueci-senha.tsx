"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import type { z } from "zod";
import { AvisoErro, CampoTexto } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { authClient, mensagemDeErro } from "@/lib/auth-client";
import { esquemaEsqueciSenha } from "../esquemas";

export function FormEsqueciSenha() {
  const [enviadoPara, setEnviadoPara] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof esquemaEsqueciSenha>>({
    resolver: zodResolver(esquemaEsqueciSenha),
    defaultValues: { email: "" },
  });

  async function enviar({ email }: z.infer<typeof esquemaEsqueciSenha>) {
    setErro(null);
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/redefinir-senha" });
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setEnviadoPara(email);
  }

  if (enviadoPara) {
    return (
      <div className="rounded-xl border bg-card p-5" role="status">
        <MailCheck className="mb-3 size-7 text-primary" aria-hidden="true" />
        <p className="font-medium">Confira seu e-mail</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Se existir uma conta com <strong className="text-foreground">{enviadoPara}</strong>, chega em instantes um link
          para criar uma nova senha. Ele vale por 1 hora. Olhe também a caixa de spam.
        </p>
        <Button asChild variant="outline" className="mt-5 w-full">
          <Link href="/entrar">Voltar para entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(enviar)} noValidate>
      <FieldGroup>
        <CampoTexto
          control={form.control}
          name="email"
          rotulo="E-mail da conta"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoFocus
        />
        <AvisoErro mensagem={erro} />
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Enviando…" : "Enviar link"}
        </Button>
      </FieldGroup>
      <p className="mt-6 text-center text-sm">
        <Link href="/entrar" className="font-medium text-primary underline-offset-4 hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </form>
  );
}
