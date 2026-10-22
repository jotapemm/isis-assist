"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AvisoErro, CampoAreaTexto, CampoMoeda } from "@/components/campos/campos";
import { useEnviar } from "@/components/campos/use-enviar";
import { Button } from "@/components/ui/button";
import { editarContrato } from "../acoes";
import { type DadosEditarContrato, esquemaEditarContrato } from "../esquemas";
import { CampoCaucao, CampoFiador, CampoPrazo, CampoReajuste, CampoVencimento } from "./campos-contrato";

/** Apartamento, inquilino e início não mudam: para isso, encerra-se o contrato e faz-se outro. */
export function FormEditarContrato({
  id,
  inicio,
  inicial,
  fiador,
}: {
  id: string;
  inicio: string;
  inicial: DadosEditarContrato;
  fiador: { id: string; nome: string } | null;
}) {
  const form = useForm<DadosEditarContrato>({ resolver: zodResolver(esquemaEditarContrato), defaultValues: inicial });
  const { enviar, pendente, erro } = useEnviar(form, (dados) => editarContrato(id, dados), "Contrato atualizado.");
  const aluguel = useWatch({ control: form.control, name: "valorAluguel" });

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-7">
      <CampoMoeda
        control={form.control}
        name="valorAluguel"
        rotulo="Aluguel mensal"
        descricao="Para o reajuste anual, use “Aplicar reajuste” na página do contrato: ele fica registrado."
        className="sm:max-w-64"
      />
      <CampoVencimento control={form.control} />
      <CampoPrazo control={form.control} inicioFixo={inicio} />
      <CampoCaucao control={form.control} aluguel={aluguel} />
      <CampoReajuste control={form.control} />
      <CampoFiador control={form.control} fiador={fiador} />
      <CampoAreaTexto control={form.control} name="observacoes" rotulo="Observações" opcional />

      <div>
        <AvisoErro mensagem={erro} />
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button asChild variant="ghost">
            <Link href={`/contratos/${id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={pendente}>
            {pendente ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </form>
  );
}
