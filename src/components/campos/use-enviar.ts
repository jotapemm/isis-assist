"use client";

import { useState, useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import type { Resultado } from "@/lib/resultado";

/**
 * Liga um formulário a uma server action: valida no navegador, chama a action, mostra o aviso
 * de sucesso e espalha os erros do servidor embaixo de cada campo.
 */
export function useEnviar<T extends FieldValues>(
  form: UseFormReturn<T>,
  acao: (dados: T) => Promise<Resultado>,
  mensagemSucesso: string,
  /** Formulário em passos: o campo com erro pode não estar na tela, então o aviso geral sempre aparece. */
  { sempreMostrarErro = false }: { sempreMostrarErro?: boolean } = {},
) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const enviar = form.handleSubmit((dados) => {
    setErro(null);
    iniciar(async () => {
      const resultado = await acao(dados);
      // Action que redireciona (ex.: cadastrar e abrir a página nova) não devolve nada: a navegação já cuida.
      if (!resultado) return;
      if (resultado.ok) {
        toast.success(mensagemSucesso);
        form.reset(dados);
        return;
      }
      // Se o erro geral é o mesmo de um campo (ex.: CPF repetido), ele já aparece embaixo do campo.
      const mensagensDosCampos = Object.values(resultado.campos ?? {});
      setErro(!sempreMostrarErro && mensagensDosCampos.includes(resultado.erro) ? null : resultado.erro);
      for (const [campo, mensagem] of Object.entries(resultado.campos ?? {})) {
        form.setError(campo as Path<T>, { message: mensagem });
      }
    });
  });

  return { enviar, pendente, erro };
}
