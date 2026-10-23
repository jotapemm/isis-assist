"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro, InputMoeda } from "@/components/campos/campos";
import { Escolha } from "@/components/campos/escolha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import { ListaDocumentos } from "@/modulos/arquivos/componentes/lista-documentos";
import { editarDespesa, lancarDespesa, removerDespesa, restaurarDespesa } from "../acoes";
import type { FinanceiroDoMes } from "../consultas";
import type { DadosDespesa } from "../esquemas";
import { CATEGORIAS_DESPESA, type CategoriaDespesa } from "../regras";

export type DespesaLinha = FinanceiroDoMes["despesas"][number];
const GERAL = "geral";

/** Lançar (despesa = null) ou editar uma despesa. Remover pede confirmação e dá para desfazer. */
export function GavetaDespesa({
  aberta,
  despesa,
  aptos,
  tipo,
  hoje,
  aoFechar,
}: {
  aberta: boolean;
  despesa: DespesaLinha | null;
  aptos: { id: string; identificacao: string }[];
  tipo: TipoResidencial;
  hoje: string;
  aoFechar: () => void;
}) {
  return (
    <Sheet open={aberta} onOpenChange={(sim) => !sim && aoFechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {aberta && <Formulario key={despesa?.id ?? "nova"} despesa={despesa} aptos={aptos} tipo={tipo} hoje={hoje} aoConcluir={aoFechar} />}
      </SheetContent>
    </Sheet>
  );
}

function Formulario({
  despesa,
  aptos,
  tipo,
  hoje,
  aoConcluir,
}: {
  despesa: DespesaLinha | null;
  aptos: { id: string; identificacao: string }[];
  tipo: TipoResidencial;
  hoje: string;
  aoConcluir: () => void;
}) {
  const v = vocabulario(tipo);
  const [dados, setDados] = useState<DadosDespesa>({
    data: despesa?.data ?? hoje,
    categoria: despesa?.categoria ?? "MANUTENCAO",
    descricao: despesa?.descricao ?? "",
    valor: despesa?.valor ?? 0,
    apartamentoId: despesa?.apartamento?.id ?? "",
    observacao: despesa?.observacao ?? "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const mudar = <K extends keyof DadosDespesa>(campo: K, valor: DadosDespesa[K]) => setDados((d) => ({ ...d, [campo]: valor }));

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = despesa ? await editarDespesa(despesa.id, dados) : await lancarDespesa(dados);
      if (!r.ok) {
        setErro(Object.values(r.campos ?? {})[0] ?? r.erro);
        return;
      }
      toast.success(despesa ? "Despesa atualizada." : "Despesa lançada.");
      aoConcluir();
    });
  }

  function remover() {
    if (!despesa) return;
    iniciar(async () => {
      await removerDespesa(despesa.id);
      toast.success("Despesa removida.", {
        action: { label: "Desfazer", onClick: () => void restaurarDespesa(despesa.id) },
      });
      aoConcluir();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{despesa ? "Editar despesa" : "Lançar despesa"}</SheetTitle>
        <SheetDescription>Conta paga do residencial: entra no relatório do mês e no lucro.</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-4 pb-8">
        <div className="flex flex-col gap-2 text-sm font-medium">
          Tipo
          <Escolha
            rotulo="Tipo de despesa"
            opcoes={(Object.keys(CATEGORIAS_DESPESA) as CategoriaDespesa[]).map((c) => ({ valor: c, rotulo: CATEGORIAS_DESPESA[c] }))}
            valor={dados.categoria}
            aoMudar={(c) => mudar("categoria", c)}
          />
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Descrição
          <Input value={dados.descricao} onChange={(e) => mudar("descricao", e.target.value)} placeholder="Ex.: troca do chuveiro" autoCapitalize="sentences" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Valor
            <InputMoeda centavos={dados.valor} aoMudar={(c) => mudar("valor", c)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Pago em
            <Input type="date" value={dados.data} onChange={(e) => mudar("data", e.target.value)} className="block" />
          </label>
        </div>

        <div className="flex flex-col gap-1.5 text-sm font-medium">
          De qual {v.singular}?
          <Select value={dados.apartamentoId || GERAL} onValueChange={(id) => mudar("apartamentoId", id === GERAL ? "" : id)}>
            <SelectTrigger className="w-full" aria-label={`De qual ${v.singular}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value={GERAL}>Geral do residencial</SelectItem>
              {aptos.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {v.nome(a.identificacao)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Observação <span className="font-normal text-muted-foreground">(opcional)</span>
          <Textarea value={dados.observacao} onChange={(e) => mudar("observacao", e.target.value)} className="min-h-16" />
        </label>

        {despesa && (
          <div className="flex flex-col gap-2 text-sm font-medium">
            Comprovante
            <ListaDocumentos
              destino={{ categoria: "COMPROVANTE", despesaId: despesa.id }}
              documentos={despesa.arquivos}
              vazio="Nenhum comprovante anexado."
              rotuloEnviar="Anexar comprovante"
            />
          </div>
        )}

        <AvisoErro mensagem={erro} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {despesa ? (
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={remover} disabled={salvando}>
              <Trash2 className="size-4" />
              Remover
            </Button>
          ) : (
            <span />
          )}
          <Button size="lg" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando…" : despesa ? "Salvar" : "Lançar despesa"}
          </Button>
        </div>
        {!despesa && <p className="text-sm text-muted-foreground">Depois de lançar, abra a despesa para anexar o comprovante.</p>}
      </div>
    </>
  );
}
