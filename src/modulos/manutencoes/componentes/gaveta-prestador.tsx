"use client";

import { useState, useTransition } from "react";
import { Archive } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { mascararCpfCnpj, mascararTelefone } from "@/lib/mascaras";
import { arquivarPrestador, criarPrestador, editarPrestador } from "../acoes";
import type { DadosPrestador } from "../esquemas";
import { ESPECIALIDADES } from "../regras";

export type PrestadorEditavel = {
  id: string;
  nome: string;
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  documento: string | null;
  chavePix: string | null;
  observacoes: string | null;
};

/** Cadastro e edição do prestador. `aoCriar` devolve o novo (o formulário da OS já o seleciona). */
export function GavetaPrestador({
  aberta,
  prestador,
  aoFechar,
  aoCriar,
}: {
  aberta: boolean;
  prestador: PrestadorEditavel | null;
  aoFechar: () => void;
  aoCriar?: (p: { id: string; nome: string }) => void;
}) {
  return (
    <Sheet open={aberta} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {/* key: ao trocar de prestador, o formulário começa limpo */}
        {aberta && <Formulario key={prestador?.id ?? "novo"} prestador={prestador} aoConcluir={aoFechar} aoCriar={aoCriar} />}
      </SheetContent>
    </Sheet>
  );
}

function Formulario({
  prestador,
  aoConcluir,
  aoCriar,
}: {
  prestador: PrestadorEditavel | null;
  aoConcluir: () => void;
  aoCriar?: (p: { id: string; nome: string }) => void;
}) {
  const [dados, setDados] = useState<DadosPrestador>({
    nome: prestador?.nome ?? "",
    especialidade: prestador?.especialidade ?? "",
    telefone: prestador?.telefone ? mascararTelefone(prestador.telefone) : "",
    email: prestador?.email ?? "",
    documento: prestador?.documento ? mascararCpfCnpj(prestador.documento) : "",
    chavePix: prestador?.chavePix ?? "",
    observacoes: prestador?.observacoes ?? "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const mudar = <K extends keyof DadosPrestador>(campo: K, valor: DadosPrestador[K]) => setDados((d) => ({ ...d, [campo]: valor }));

  function salvar() {
    setErro(null);
    iniciar(async () => {
      if (prestador) {
        const r = await editarPrestador(prestador.id, dados);
        if (!r.ok) return setErro(Object.values(r.campos ?? {})[0] ?? r.erro);
        toast.success("Prestador atualizado.");
      } else {
        const r = await criarPrestador(dados);
        if (!r.ok) return setErro(Object.values(r.campos ?? {})[0] ?? r.erro);
        toast.success(`${r.dados.nome} cadastrado.`);
        aoCriar?.(r.dados);
      }
      aoConcluir();
    });
  }

  function arquivar() {
    if (!prestador) return;
    iniciar(async () => {
      await arquivarPrestador(prestador.id);
      toast.success(`${prestador.nome} saiu da lista.`);
      aoConcluir();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{prestador ? "Editar prestador" : "Novo prestador"}</SheetTitle>
        <SheetDescription>Quem faz os consertos. Só o nome é obrigatório.</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-4 pb-8">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Nome
          <Input value={dados.nome} onChange={(e) => mudar("nome", e.target.value)} placeholder="Ex.: Jorge Hidráulica" autoCapitalize="words" />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          O que faz <span className="font-normal text-muted-foreground">(opcional)</span>
          <Input
            value={dados.especialidade}
            onChange={(e) => mudar("especialidade", e.target.value)}
            list="especialidades"
            placeholder="Ex.: Encanador"
            autoCapitalize="sentences"
          />
          <datalist id="especialidades">
            {ESPECIALIDADES.map((e) => (
              <option key={e} value={e} />
            ))}
          </datalist>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Celular
            <Input
              value={dados.telefone}
              onChange={(e) => mudar("telefone", mascararTelefone(e.target.value))}
              inputMode="tel"
              placeholder="(19) 99999-9999"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            E-mail
            <Input value={dados.email} onChange={(e) => mudar("email", e.target.value)} type="email" inputMode="email" autoCapitalize="none" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            CPF ou CNPJ
            <Input value={dados.documento} onChange={(e) => mudar("documento", mascararCpfCnpj(e.target.value))} inputMode="numeric" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Chave PIX
            <Input value={dados.chavePix} onChange={(e) => mudar("chavePix", e.target.value)} autoCapitalize="none" />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Observações <span className="font-normal text-muted-foreground">(opcional)</span>
          <Textarea
            value={dados.observacoes}
            onChange={(e) => mudar("observacoes", e.target.value)}
            placeholder="Ex.: atende sábado; cobra a visita"
            className="min-h-16"
          />
        </label>

        <AvisoErro mensagem={erro} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {prestador ? (
            <Button variant="ghost" className="text-muted-foreground" onClick={arquivar} disabled={salvando}>
              <Archive className="size-4" />
              Tirar da lista
            </Button>
          ) : (
            <span />
          )}
          <Button size="lg" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : prestador ? "Salvar" : "Cadastrar"}
          </Button>
        </div>
      </div>
    </>
  );
}
