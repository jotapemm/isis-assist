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
import { esquemaCriarConta } from "../esquemas";

export function FormCriarConta() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const form = useForm<z.infer<typeof esquemaCriarConta>>({
    resolver: zodResolver(esquemaCriarConta),
    defaultValues: { nome: "", email: "", senha: "" },
  });

  async function criar(dados: z.infer<typeof esquemaCriarConta>) {
    setErro(null);
    const { error } = await authClient.signUp.email({ name: dados.nome, email: dados.email, password: dados.senha });
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    router.replace("/boas-vindas");
  }

  return (
    <form method="post" onSubmit={form.handleSubmit(criar)} noValidate>
      <FieldGroup>
        <CampoTexto control={form.control} name="nome" rotulo="Seu nome" autoComplete="name" autoCapitalize="words" autoFocus />
        <CampoTexto
          control={form.control}
          name="email"
          rotulo="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
        />
        <CampoSenha
          control={form.control}
          name="senha"
          rotulo="Senha"
          descricao="Pelo menos 8 caracteres."
          autoComplete="new-password"
        />
        <AvisoErro mensagem={erro} />
        <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Criando…" : "Criar conta"}
        </Button>
      </FieldGroup>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-primary underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
