"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro } from "@/components/campos/campos";
import { Escolha } from "@/components/campos/escolha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import { apagarLembrete, criarLembrete, editarLembrete } from "../acoes";
import type { LembreteLinha } from "../consultas";
import type { DadosLembrete } from "../esquemas";
import { RECORRENCIA, RECORRENCIAS } from "../regras";

const TODO = "residencial-todo";

type Props = {
  aberta: boolean;
  /** null = novo. */
  lembrete: LembreteLinha | null;
  aptos: { id: string; identificacao: string }[];
  tipo: TipoResidencial;
  hoje: string;
  /** Novo lembrete já com data ou imóvel (calendário, página do imóvel). */
  inicial?: Partial<Pick<DadosLembrete, "data" | "apartamentoId">>;
  aoFechar: () => void;
};

export function GavetaLembrete(props: Props) {
  return (
    <Sheet open={props.aberta} onOpenChange={(abrir) => !abrir && props.aoFechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {/* key: ao trocar de lembrete, o formulário começa limpo */}
        {props.aberta && <Formulario key={props.lembrete?.id ?? `novo-${props.inicial?.data ?? ""}`} {...props} />}
      </SheetContent>
    </Sheet>
  );
}

function Formulario({ lembrete, aptos, tipo, hoje, inicial, aoFechar }: Props) {
  const v = vocabulario(tipo);
  const [dados, setDados] = useState<DadosLembrete>({
    titulo: lembrete?.titulo ?? "",
    descricao: lembrete?.descricao ?? "",
    data: lembrete ? (lembrete.data ?? "") : (inicial?.data ?? hoje),
    hora: lembrete?.hora ?? "",
    apartamentoId: lembrete?.apartamento?.id ?? inicial?.apartamentoId ?? "",
    importante: lembrete?.importante ?? false,
    recorrencia: lembrete?.recorrencia ?? "NENHUMA",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const mudar = <K extends keyof DadosLembrete>(campo: K, valor: DadosLembrete[K]) => setDados((d) => ({ ...d, [campo]: valor }));
  const anotacao = dados.data === "";

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = lembrete ? await editarLembrete(lembrete.id, dados) : await criarLembrete(dados);
      if (!r.ok) return setErro(Object.values(r.campos ?? {})[0] ?? r.erro);
      toast.success(lembrete ? "Lembrete atualizado." : anotacao ? "Anotação guardada." : "Lembrete criado.");
      aoFechar();
    });
  }

  function apagar() {
    if (!lembrete) return;
    iniciar(async () => {
      const r = await apagarLembrete(lembrete.id);
      if (r.ok) toast.success("Apagado.");
      else toast.error(r.erro);
      aoFechar();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{lembrete ? "Editar lembrete" : "Novo lembrete"}</SheetTitle>
        <SheetDescription>Sem data, vira uma anotação: fica guardada para consultar quando precisar.</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-4 pb-8">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          O que é para lembrar
          <Input
            value={dados.titulo}
            onChange={(e) => mudar("titulo", e.target.value)}
            placeholder="Ex.: ligar para o encanador"
            autoCapitalize="sentences"
            autoFocus={!lembrete}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Data
              <Input type="date" value={dados.data} onChange={(e) => mudar("data", e.target.value)} className="block" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Hora <span className="font-normal text-muted-foreground">(opcional)</span>
              <Input type="time" value={dados.hora} disabled={anotacao} onChange={(e) => mudar("hora", e.target.value)} className="block" />
            </label>
          </div>
          {anotacao ? (
            <Button type="button" variant="link" className="h-auto self-start p-0" onClick={() => mudar("data", hoje)}>
              Pôr uma data
            </Button>
          ) : (
            <Button
              type="button"
              variant="link"
              className="h-auto self-start p-0 text-muted-foreground"
              onClick={() => setDados((d) => ({ ...d, data: "", hora: "", recorrencia: "NENHUMA" }))}
            >
              Sem data (guardar como anotação)
            </Button>
          )}
        </div>

        {!anotacao && (
          <div className="flex flex-col gap-2 text-sm font-medium">
            Repetir
            <Escolha
              rotulo="Repetir"
              opcoes={RECORRENCIAS.map((r) => ({ valor: r, rotulo: RECORRENCIA[r].rotulo }))}
              valor={dados.recorrencia}
              aoMudar={(r) => mudar("recorrencia", r)}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          Sobre qual {v.singular}?
          <Select value={dados.apartamentoId || TODO} onValueChange={(id) => mudar("apartamentoId", id === TODO ? "" : id)}>
            <SelectTrigger className="w-full" aria-label={`Sobre qual ${v.singular}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value={TODO}>O residencial todo</SelectItem>
              {aptos.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {v.nome(a.identificacao)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Detalhes <span className="font-normal text-muted-foreground">(opcional)</span>
          <Textarea value={dados.descricao} onChange={(e) => mudar("descricao", e.target.value)} className="min-h-20" />
        </label>

        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch checked={dados.importante} onCheckedChange={(sim) => mudar("importante", sim)} />
          Importante (aparece em destaque)
        </label>

        <AvisoErro mensagem={erro} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {lembrete ? (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={apagar} disabled={salvando}>
              <Trash2 className="size-4" />
              Apagar
            </Button>
          ) : (
            <span />
          )}
          <Button size="lg" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : lembrete ? "Salvar" : anotacao ? "Guardar anotação" : "Criar lembrete"}
          </Button>
        </div>
      </div>
    </>
  );
}
