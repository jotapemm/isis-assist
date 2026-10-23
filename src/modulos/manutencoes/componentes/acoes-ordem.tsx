"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCircle2, Pencil, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro, InputMoeda } from "@/components/campos/campos";
import { Escolha } from "@/components/campos/escolha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { STATUS } from "@/modulos/apartamentos/status";
import { mesPorExtenso } from "@/modulos/financeiro/regras";
import { cancelarOrdem, comecarOrdem, concluirOrdem, editarOrdem, reabrirOrdem } from "../acoes";
import type { DadosEditarOrdem } from "../esquemas";
import { emAberto, numeroOS, PRIORIDADE, PRIORIDADES_OS, type PrioridadeOS, type StatusOS } from "../regras";

const SEM_PRESTADOR = "sem-prestador";

type Props = {
  os: {
    id: string;
    numero: number;
    titulo: string;
    descricao: string | null;
    prioridade: PrioridadeOS;
    status: StatusOS;
    custoEstimado: number | null;
    abertaEm: string;
    prestadorId: string | null;
  };
  /** Nome do imóvel ("apto 301"), ou null na área comum. */
  imovel: string | null;
  /** Status para o qual o imóvel pode voltar ao encerrar (regras.ts: ofereceVoltarStatus). */
  voltar: { para: string; sugerido: boolean } | null;
  prestadores: { id: string; nome: string }[];
  hoje: string;
};

type Gaveta = "concluir" | "cancelar" | "editar" | null;

/** Os botões da OS: começar, concluir, cancelar, editar e reabrir — cada um só quando faz sentido. */
export function AcoesOrdem(props: Props) {
  const { os } = props;
  const [gaveta, setGaveta] = useState<Gaveta>(null);
  const [ocupado, iniciar] = useTransition();
  const aberta = emAberto(os.status);

  function rodar(acao: () => Promise<{ ok: boolean; erro?: string }>, mensagem: string) {
    iniciar(async () => {
      const r = await acao();
      if (r.ok) toast.success(mensagem);
      else toast.error(r.erro);
    });
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {os.status === "ABERTA" && (
          <Button variant="outline" disabled={ocupado} onClick={() => rodar(() => comecarOrdem(os.id), "Marcada como em andamento.")}>
            <Play className="size-4" />
            Começou
          </Button>
        )}
        {aberta && (
          <>
            <Button onClick={() => setGaveta("concluir")}>
              <CheckCircle2 className="size-4" />
              Concluir
            </Button>
            <Button variant="outline" onClick={() => setGaveta("editar")}>
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setGaveta("cancelar")}>
              <Ban className="size-4" />
              Cancelar
            </Button>
          </>
        )}
        {!aberta && (
          <Button
            variant="outline"
            disabled={ocupado}
            onClick={() =>
              rodar(
                () => reabrirOrdem(os.id),
                os.status === "CONCLUIDA" ? "Reaberta. A despesa da conclusão saiu do Financeiro." : "Reaberta.",
              )
            }
          >
            <RotateCcw className="size-4" />
            Reabrir
          </Button>
        )}
      </div>

      <Sheet open={gaveta !== null} onOpenChange={(abrir) => !abrir && setGaveta(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {gaveta === "concluir" && <Concluir {...props} aoFechar={() => setGaveta(null)} />}
          {gaveta === "cancelar" && <Cancelar {...props} aoFechar={() => setGaveta(null)} />}
          {gaveta === "editar" && <Editar {...props} aoFechar={() => setGaveta(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

const rotuloStatus = (status: string) => STATUS[status as keyof typeof STATUS]?.rotulo ?? status;

/** "Voltar o apto 301 para Livre" — só aparece se foi esta OS que o pôs em Manutenção. */
function PerguntaVoltar({ imovel, voltar, valor, aoMudar }: { imovel: string | null; voltar: Props["voltar"]; valor: boolean; aoMudar: (v: boolean) => void }) {
  if (!voltar || !imovel) return null;
  return (
    <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
      <Switch checked={valor} onCheckedChange={aoMudar} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">
          Voltar {imovel} para {rotuloStatus(voltar.para)}
        </span>
        <span className="text-muted-foreground">
          {voltar.sugerido ? "Era o status antes desta ordem." : "Atenção: tem outra ordem aberta para este imóvel."}
        </span>
      </span>
    </label>
  );
}

function Concluir({ os, imovel, voltar, hoje, aoFechar }: Props & { aoFechar: () => void }) {
  const [concluidaEm, setConcluidaEm] = useState(hoje);
  const [custo, setCusto] = useState(os.custoEstimado ?? 0);
  const [solucao, setSolucao] = useState("");
  const [voltarStatus, setVoltarStatus] = useState(voltar?.sugerido ?? false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function concluir() {
    setErro(null);
    iniciar(async () => {
      const r = await concluirOrdem(os.id, { concluidaEm, custoFinal: custo, solucao, voltarStatus });
      if (!r.ok) return setErro(Object.values(r.campos ?? {})[0] ?? r.erro);
      toast.success(custo > 0 ? "Concluída. O custo entrou nas despesas do Financeiro." : "Concluída.");
      aoFechar();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Concluir {numeroOS(os.numero)}</SheetTitle>
        <SheetDescription>{os.titulo}</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Custo final
            <InputMoeda centavos={custo} aoMudar={setCusto} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Concluída em
            <Input type="date" value={concluidaEm} min={os.abertaEm} max={hoje} onChange={(e) => setConcluidaEm(e.target.value)} className="block" />
          </label>
        </div>
        <p className="-mt-2 text-sm text-muted-foreground">
          {custo > 0
            ? `Vira uma despesa de Manutenção no Financeiro de ${mesPorExtenso(`${concluidaEm.slice(0, 7)}-01`)}.`
            : "Sem custo (garantia, feito por você…): nenhuma despesa é lançada."}
        </p>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          O que foi feito <span className="font-normal text-muted-foreground">(opcional)</span>
          <Textarea value={solucao} onChange={(e) => setSolucao(e.target.value)} placeholder="Ex.: trocou o sifão e o rejunte" className="min-h-20" />
        </label>
        <PerguntaVoltar imovel={imovel} voltar={voltar} valor={voltarStatus} aoMudar={setVoltarStatus} />
        <AvisoErro mensagem={erro} />
        <Button size="lg" onClick={concluir} disabled={salvando}>
          {salvando ? "Concluindo…" : "Concluir ordem"}
        </Button>
      </div>
    </>
  );
}

function Cancelar({ os, imovel, voltar, aoFechar }: Props & { aoFechar: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [voltarStatus, setVoltarStatus] = useState(voltar?.sugerido ?? false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function cancelar() {
    setErro(null);
    iniciar(async () => {
      const r = await cancelarOrdem(os.id, { motivo, voltarStatus });
      if (!r.ok) return setErro(r.erro);
      toast.success("Ordem cancelada.");
      aoFechar();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Cancelar {numeroOS(os.numero)}?</SheetTitle>
        <SheetDescription>Fica no histórico como cancelada. Dá para reabrir depois.</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-8">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Por quê <span className="font-normal text-muted-foreground">(opcional)</span>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: o inquilino mesmo resolveu" className="min-h-20" />
        </label>
        <PerguntaVoltar imovel={imovel} voltar={voltar} valor={voltarStatus} aoMudar={setVoltarStatus} />
        <AvisoErro mensagem={erro} />
        <Button size="lg" variant="destructive" onClick={cancelar} disabled={salvando}>
          {salvando ? "Cancelando…" : "Cancelar ordem"}
        </Button>
      </div>
    </>
  );
}

function Editar({ os, prestadores, aoFechar }: Props & { aoFechar: () => void }) {
  const [dados, setDados] = useState<DadosEditarOrdem>({
    titulo: os.titulo,
    descricao: os.descricao ?? "",
    prioridade: os.prioridade,
    prestadorId: os.prestadorId ?? "",
    custoEstimado: os.custoEstimado ?? 0,
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const mudar = <K extends keyof DadosEditarOrdem>(campo: K, valor: DadosEditarOrdem[K]) => setDados((d) => ({ ...d, [campo]: valor }));

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await editarOrdem(os.id, dados);
      if (!r.ok) return setErro(Object.values(r.campos ?? {})[0] ?? r.erro);
      toast.success("Ordem atualizada.");
      aoFechar();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Editar {numeroOS(os.numero)}</SheetTitle>
        <SheetDescription>O imóvel não muda depois de aberta: para outro, abra uma ordem nova.</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-5 px-4 pb-8">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          O que precisa de conserto
          <Input value={dados.titulo} onChange={(e) => mudar("titulo", e.target.value)} autoCapitalize="sentences" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Detalhes
          <Textarea value={dados.descricao} onChange={(e) => mudar("descricao", e.target.value)} className="min-h-24" />
        </label>
        <div className="flex flex-col gap-2 text-sm font-medium">
          Pressa
          <Escolha
            rotulo="Prioridade"
            opcoes={[...PRIORIDADES_OS].reverse().map((p) => ({ valor: p, rotulo: PRIORIDADE[p].rotulo }))}
            valor={dados.prioridade}
            aoMudar={(p) => mudar("prioridade", p)}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm font-medium">
          Quem vai fazer
          <Select value={dados.prestadorId || SEM_PRESTADOR} onValueChange={(id) => mudar("prestadorId", id === SEM_PRESTADOR ? "" : id)}>
            <SelectTrigger className="w-full" aria-label="Prestador">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value={SEM_PRESTADOR}>Ainda não sei</SelectItem>
              {prestadores.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Custo estimado
          <InputMoeda centavos={dados.custoEstimado} aoMudar={(c) => mudar("custoEstimado", c)} />
        </label>
        <AvisoErro mensagem={erro} />
        <Button size="lg" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </>
  );
}
