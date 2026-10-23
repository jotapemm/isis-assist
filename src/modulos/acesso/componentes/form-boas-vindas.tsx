"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { AvisoErro, CampoTexto } from "@/components/campos/campos";
import { EscolhaTipoResidencial } from "@/components/campos/escolha-tipo-residencial";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { criarResidencial } from "@/modulos/conta/acoes";
import { esquemaResidencial } from "@/modulos/conta/esquemas";

export function FormBoasVindas() {
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();
  const form = useForm<z.infer<typeof esquemaResidencial>>({
    resolver: zodResolver(esquemaResidencial),
    defaultValues: { nome: "", tipo: "EDIFICIO" },
  });

  function continuar(dados: z.infer<typeof esquemaResidencial>) {
    setErro(null);
    iniciar(async () => {
      // Se der certo, a action redireciona para o painel e nada abaixo roda.
      const resultado = await criarResidencial(dados);
      if (resultado && !resultado.ok) setErro(resultado.erro);
    });
  }

  return (
    <form method="post" onSubmit={form.handleSubmit(continuar)} noValidate>
      <FieldGroup>
        <CampoTexto
          control={form.control}
          name="nome"
          rotulo="Nome do residencial"
          placeholder="Ex.: Residencial Isis"
          descricao="Dá para mudar depois em Configurações."
          autoCapitalize="words"
          autoFocus
        />
        <div className="flex flex-col gap-2.5">
          <p className="text-sm font-medium">Como ele é?</p>
          <EscolhaTipoResidencial control={form.control} />
        </div>
        <AvisoErro mensagem={erro} />
        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando ? "Preparando…" : "Continuar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
