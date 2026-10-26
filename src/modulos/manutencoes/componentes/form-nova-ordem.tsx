"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { AvisoErro, InputMoeda } from "@/components/campos/campos";
import { Escolha } from "@/components/campos/escolha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { STATUS } from "@/modulos/apartamentos/status";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import { abrirOrdem } from "../acoes";
import type { DadosNovaOrdem } from "../esquemas";
import { ofereceManutencao, PRIORIDADE, PRIORIDADES_OS } from "../regras";
import { GavetaPrestador } from "./gaveta-prestador";

const COMUM = "area-comum";
const SEM_PRESTADOR = "sem-prestador";

type Props = {
  tipo: TipoResidencial;
  hoje: string;
  aptos: { id: string; identificacao: string; status: string }[];
  prestadores: { id: string; nome: string; especialidade: string | null }[];
  aptoInicial?: string;
  tituloInicial?: string;
};

export function FormNovaOrdem({ tipo, hoje, aptos, prestadores: iniciais, aptoInicial, tituloInicial }: Props) {
  const v = vocabulario(tipo);
  const [prestadores, setPrestadores] = useState(iniciais);
  const [novoPrestador, setNovoPrestador] = useState(false);
  const [dados, setDados] = useState<DadosNovaOrdem>(() => {
    const apto = aptos.find((a) => a.id === aptoInicial);
    return {
      apartamentoId: apto?.id ?? "",
      titulo: tituloInicial ?? "",
      descricao: "",
      prioridade: "MEDIA",
      prestadorId: "",
      custoEstimado: 0,
      abertaEm: hoje,
      colocarEmManutencao: apto ? ofereceManutencao(apto.status) : false,
    };
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const mudar = <K extends keyof DadosNovaOrdem>(campo: K, valor: DadosNovaOrdem[K]) => setDados((d) => ({ ...d, [campo]: valor }));

  const apto = aptos.find((a) => a.id === dados.apartamentoId);
  const perguntaManutencao = apto && ofereceManutencao(apto.status);

  function escolherApto(id: string) {
    const escolhido = aptos.find((a) => a.id === id);
    // Imóvel vazio: a sugestão é tirá-lo do aluguel enquanto o conserto não acaba (docs/PLANO.md, regra 6).
    setDados((d) => ({ ...d, apartamentoId: escolhido?.id ?? "", colocarEmManutencao: escolhido ? ofereceManutencao(escolhido.status) : false }));
  }

  function abrir(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    iniciar(async () => {
      // Dá certo → a action leva para a página da OS; só volta aqui com erro.
      const r = await abrirOrdem(dados);
      if (r && !r.ok) setErro(Object.values(r.campos ?? {})[0] ?? r.erro);
    });
  }

  return (
    <form method="post" onSubmit={abrir} noValidate className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-sm font-medium">
        Onde
        <Select value={dados.apartamentoId || COMUM} onValueChange={(id) => escolherApto(id === COMUM ? "" : id)}>
          <SelectTrigger className="w-full" aria-label="Onde é o conserto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value={COMUM}>Área comum do residencial</SelectItem>
            {aptos.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {v.nome(a.identificacao)} · {STATUS[a.status as keyof typeof STATUS].rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {perguntaManutencao && (
        <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
          <Switch checked={dados.colocarEmManutencao} onCheckedChange={(sim) => mudar("colocarEmManutencao", sim)} className="mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium">
              Colocar {v.o} {v.nomeMinusculo(apto.identificacao)} em Manutenção
            </span>
            <span className="text-muted-foreground">
              Hoje está {STATUS[apto.status as keyof typeof STATUS].rotulo.toLowerCase()}. Ao concluir, dá para voltar ao status de antes.
            </span>
          </span>
        </label>
      )}
      {apto?.status === "OCUPADO" && (
        <p className="-mt-3 text-sm text-muted-foreground">
          Com inquilino morando, {v.o} {v.singular} continua Ocupad{v.o} e ganha o selo de manutenção no mapa.
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        O que precisa de conserto
        <Input
          value={dados.titulo}
          onChange={(e) => mudar("titulo", e.target.value)}
          placeholder="Ex.: vazamento no banheiro"
          autoCapitalize="sentences"
          autoFocus
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Detalhes <span className="font-normal text-muted-foreground">(opcional)</span>
        <Textarea
          value={dados.descricao}
          onChange={(e) => mudar("descricao", e.target.value)}
          placeholder="Onde fica, desde quando, o que o inquilino contou…"
          className="min-h-24"
        />
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={dados.prestadorId || SEM_PRESTADOR} onValueChange={(id) => mudar("prestadorId", id === SEM_PRESTADOR ? "" : id)}>
            <SelectTrigger className="w-full" aria-label="Prestador">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              <SelectItem value={SEM_PRESTADOR}>Ainda não sei</SelectItem>
              {prestadores.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                  {p.especialidade && ` · ${p.especialidade}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => setNovoPrestador(true)}>
            <UserPlus className="size-4" />
            Novo prestador
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Custo estimado <span className="font-normal text-muted-foreground">(se já tiver orçamento)</span>
          <InputMoeda centavos={dados.custoEstimado} aoMudar={(c) => mudar("custoEstimado", c)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Aberta em
          <Input type="date" value={dados.abertaEm} max={hoje} onChange={(e) => mudar("abertaEm", e.target.value)} className="block" />
        </label>
      </div>

      <AvisoErro mensagem={erro} />
      <Button type="submit" size="lg" className="self-start" disabled={salvando}>
        {salvando ? "Abrindo…" : "Abrir ordem de serviço"}
      </Button>

      <GavetaPrestador
        aberta={novoPrestador}
        prestador={null}
        aoFechar={() => setNovoPrestador(false)}
        aoCriar={(p) => {
          setPrestadores((lista) => [...lista, { ...p, especialidade: null }].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
          mudar("prestadorId", p.id);
        }}
      />
    </form>
  );
}
