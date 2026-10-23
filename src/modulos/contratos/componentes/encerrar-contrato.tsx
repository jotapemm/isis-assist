"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { AvisoErro, CampoData, CampoMoeda, CampoTexto } from "@/components/campos/campos";
import { Escolha } from "@/components/campos/escolha";
import { useEnviar } from "@/components/campos/use-enviar";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { STATUS } from "@/modulos/apartamentos/status";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import { encerrarContrato } from "../acoes";
import { type DadosEncerrar, esquemaEncerrar, MOTIVOS_ENCERRAMENTO } from "../esquemas";

/** Inquilino saiu: data, motivo, devolução da caução e como fica o imóvel. */
export function EncerrarContrato({
  contratoId,
  nomeImovel,
  tipo,
  nomeInquilino,
  valorCaucao,
  hoje,
}: {
  contratoId: string;
  /** "Apto 203" ou "Casa 01". */
  nomeImovel: string;
  tipo: TipoResidencial;
  nomeInquilino: string;
  valorCaucao: number;
  hoje: string;
}) {
  const [aberto, setAberto] = useState(false);
  const form = useForm<DadosEncerrar>({
    resolver: zodResolver(esquemaEncerrar),
    defaultValues: {
      dataSaida: hoje,
      motivo: "Fim do prazo",
      detalhe: "",
      valorCaucaoDevolvido: valorCaucao,
      statusApto: "LIVRE",
    },
  });
  const { enviar, pendente, erro } = useEnviar(
    form,
    async (dados) => {
      const r = await encerrarContrato(contratoId, dados);
      if (r.ok) setAberto(false);
      return r;
    },
    `Contrato encerrado. ${nomeImovel} foi ${vocabulario(tipo).o === "a" ? "atualizada" : "atualizado"}.`,
  );
  const motivo = useWatch({ control: form.control, name: "motivo" });
  const statusApto = useWatch({ control: form.control, name: "statusApto" });

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <LogOut className="size-4" />
          Encerrar contrato
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Encerrar contrato</SheetTitle>
          <SheetDescription>
            {nomeInquilino} sai {vocabulario(tipo).do} {nomeImovel.toLowerCase()}. O contrato fica guardado no histórico.
          </SheetDescription>
        </SheetHeader>

        <form method="post" onSubmit={enviar} noValidate className="flex flex-col gap-6 px-4 pb-8">
          <FieldGroup className="gap-5">
            <CampoData control={form.control} name="dataSaida" rotulo="Data da saída" />
            <div className="flex flex-col gap-2.5">
              <p className="text-sm font-medium">Motivo</p>
              <Escolha
                rotulo="Motivo"
                opcoes={MOTIVOS_ENCERRAMENTO.map((m) => ({ valor: m, rotulo: m }))}
                valor={motivo}
                aoMudar={(m) => form.setValue("motivo", m)}
              />
            </div>
            {motivo === "Outro motivo" && <CampoTexto control={form.control} name="detalhe" rotulo="Qual?" />}
            {valorCaucao > 0 && (
              <CampoMoeda
                control={form.control}
                name="valorCaucaoDevolvido"
                rotulo="Caução devolvida"
                descricao={`Recebida: ${formatarMoeda(valorCaucao)}. Desconte reparos ou contas em aberto, se houver.`}
                className="sm:max-w-64"
              />
            )}
          </FieldGroup>

          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-medium">Como fica {vocabulario(tipo).o} {vocabulario(tipo).singular}</p>
            <div role="radiogroup" aria-label="Situação depois da saída" className="flex flex-col gap-2">
              {(["LIVRE", "REFORMA", "MANUTENCAO"] as const).map((s) => {
                const info = STATUS[s];
                const Icone = info.icone;
                const marcado = statusApto === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={marcado}
                    onClick={() => form.setValue("statusApto", s)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-colors",
                      marcado ? cn(info.borda, info.fundo) : "border-border hover:bg-muted/60",
                    )}
                  >
                    <Icone className={cn("size-5", info.texto)} aria-hidden="true" />
                    <span className="flex flex-col">
                      <span className="font-semibold">{info.rotulo}</span>
                      <span className="text-sm text-muted-foreground">{info.explicacao}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AvisoErro mensagem={erro} />
          <Button type="submit" size="lg" variant="destructive" disabled={pendente}>
            {pendente ? "Encerrando…" : "Encerrar contrato"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
