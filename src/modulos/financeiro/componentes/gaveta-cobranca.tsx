"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Paperclip, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro, InputMoeda } from "@/components/campos/campos";
import { Escolha } from "@/components/campos/escolha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { type TipoResidencial, vocabulario } from "@/modulos/apartamentos/vocabulario";
import { REGRAS } from "@/modulos/arquivos/regras";
import { useEnvioArquivos } from "@/modulos/arquivos/use-envio";
import { ajustarCobranca, estornarPagamento, registrarPagamento } from "../acoes";
import type { CobrancaLinha } from "../consultas";
import {
  calcularEncargos,
  FORMAS,
  type FormaPagamento,
  mensagemCobranca,
  mensagemRecibo,
  mesPorExtenso,
} from "../regras";
import { BotaoCompartilharRecibo, BotaoMensagem, BotaoVerRecibo, SeloSituacao } from "./pecas";

type Props = {
  cobranca: CobrancaLinha | null;
  tipo: TipoResidencial;
  chavePix: string | null;
  hoje: string;
  aoFechar: () => void;
};

/** Tudo de uma cobrança num lugar: registrar pagamento, recibos, lembrete no WhatsApp e ajuste. */
export function GavetaCobranca({ cobranca, tipo, chavePix, hoje, aoFechar }: Props) {
  return (
    <Sheet open={cobranca !== null} onOpenChange={(aberta) => !aberta && aoFechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {/* key: ao trocar de cobrança, o formulário começa limpo */}
        {cobranca && <Conteudo key={cobranca.id} cobranca={cobranca} tipo={tipo} chavePix={chavePix} hoje={hoje} />}
      </SheetContent>
    </Sheet>
  );
}

function Conteudo({ cobranca: c, tipo, chavePix, hoje }: Omit<Props, "aoFechar" | "cobranca"> & { cobranca: CobrancaLinha }) {
  const v = vocabulario(tipo);
  const doImovel = `${v.do} ${v.nomeMinusculo(c.apartamento.identificacao)}`;
  const [registrado, setRegistrado] = useState<{ pagamentoId: string; numeroRecibo: number; valor: number; data: string } | null>(null);

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {v.nome(c.apartamento.identificacao)} · {c.inquilino.nome.split(" ")[0]}
        </SheetTitle>
        <SheetDescription>
          Aluguel de {mesPorExtenso(c.competencia)} · vence em {formatarData(c.vencimento)}
          {c.descricao && ` · ${c.descricao}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-8">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/70 p-4">
          <div>
            <p className="font-heading text-2xl tabular-nums">{formatarMoeda(c.valor)}</p>
            <p className="text-sm text-muted-foreground">
              {c.aberto > 0 && c.pago > 0 ? `Pago ${formatarMoeda(c.pago)} · falta ${formatarMoeda(c.aberto)}` : c.aberto > 0 ? "Nada pago ainda" : "Quitado"}
            </p>
          </div>
          <SeloSituacao situacao={c.situacao} />
        </div>

        {registrado && (
          <PagamentoRegistrado
            {...registrado}
            telefone={c.inquilino.telefone}
            mensagem={mensagemRecibo({
              nomeInquilino: c.inquilino.nome,
              doImovel,
              competencia: c.competencia,
              valor: registrado.valor,
              dataPagamento: registrado.data,
              numeroRecibo: registrado.numeroRecibo,
            })}
          />
        )}

        {c.aberto > 0 && !registrado && (
          <>
            <FormPagamento cobranca={c} hoje={hoje} aoRegistrar={setRegistrado} />
            <BotaoMensagem
              telefone={c.inquilino.telefone}
              rotulo={c.situacao === "ATRASADA" ? "Cobrar no WhatsApp" : "Lembrar no WhatsApp"}
              mensagem={mensagemCobranca(
                { nomeInquilino: c.inquilino.nome, doImovel, competencia: c.competencia, vencimento: c.vencimento, valor: c.aberto, chavePix },
                c.situacao === "ATRASADA",
              )}
            />
          </>
        )}

        {c.pagamentos.length > 0 && (
          <section className="flex flex-col gap-3">
            <h3 className="font-heading text-lg">Pagamentos</h3>
            <ul className="flex flex-col gap-3">
              {c.pagamentos.map((p) => (
                <LinhaPagamento
                  key={p.id}
                  pagamento={p}
                  telefone={c.inquilino.telefone}
                  mensagem={mensagemRecibo({
                    nomeInquilino: c.inquilino.nome,
                    doImovel,
                    competencia: c.competencia,
                    valor: p.valorPago,
                    dataPagamento: p.data,
                    numeroRecibo: p.numeroRecibo,
                  })}
                />
              ))}
            </ul>
          </section>
        )}

        {c.pagamentos.length === 0 && c.status !== "CANCELADO" && <AjusteCobranca cobranca={c} />}
      </div>
    </>
  );
}

function FormPagamento({
  cobranca: c,
  hoje,
  aoRegistrar,
}: {
  cobranca: CobrancaLinha;
  hoje: string;
  aoRegistrar: (r: { pagamentoId: string; numeroRecibo: number; valor: number; data: string }) => void;
}) {
  const [data, setData] = useState(hoje);
  const [isentar, setIsentar] = useState(false);
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [valorDigitado, setValorDigitado] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  const encargos = calcularEncargos(c.aberto, c.vencimento, data || hoje, c.regras);
  const temEncargos = encargos.multa + encargos.juros > 0;
  const sugerido = c.aberto + (isentar ? 0 : encargos.multa + encargos.juros);
  // Enquanto a pessoa não mexe no valor, ele acompanha a data e a isenção.
  const valor = valorDigitado ?? sugerido;

  function registrar() {
    setErro(null);
    iniciar(async () => {
      const r = await registrarPagamento(c.id, { data, valorPago: valor, isentar, forma, observacao: "" });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      toast.success(r.dados.quitou ? "Pagamento registrado. Aluguel quitado." : "Pagamento parcial registrado.");
      aoRegistrar({ pagamentoId: r.dados.pagamentoId, numeroRecibo: r.dados.numeroRecibo, valor, data });
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border p-4">
      <h3 className="font-heading text-lg">Registrar pagamento</h3>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Pago em
        <Input type="date" value={data} max={hoje} onChange={(e) => setData(e.target.value)} className="block" />
      </label>

      {temEncargos && (
        <div className="flex flex-col gap-2 rounded-lg bg-destructive/8 p-3 text-sm">
          <p>
            {encargos.diasAtraso} dias de atraso: multa {formatarMoeda(encargos.multa)} + juros {formatarMoeda(encargos.juros)}.
          </p>
          <label className="flex items-center gap-2.5">
            <Switch
              checked={isentar}
              onCheckedChange={(sim) => {
                setIsentar(sim);
                setValorDigitado(null);
              }}
            />
            Dispensar multa e juros
          </label>
        </div>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Valor recebido
        <InputMoeda centavos={valor} aoMudar={setValorDigitado} className="text-lg" />
        {valor < sugerido && valor > 0 && (
          <span className="font-normal text-muted-foreground">
            Menor que o devido ({formatarMoeda(sugerido)}): fica registrado como pagamento parcial.
          </span>
        )}
      </label>

      <div className="flex flex-col gap-2 text-sm font-medium">
        Como foi pago
        <Escolha
          rotulo="Forma de pagamento"
          opcoes={(["PIX", "DINHEIRO", "TRANSFERENCIA", "OUTRA"] as const).map((f) => ({ valor: f, rotulo: FORMAS[f] }))}
          valor={forma}
          aoMudar={setForma}
        />
      </div>

      <AvisoErro mensagem={erro} />
      <Button size="lg" onClick={registrar} disabled={salvando || valor <= 0 || !data}>
        {salvando ? "Registrando…" : `Registrar ${formatarMoeda(valor)}`}
      </Button>
    </section>
  );
}

function PagamentoRegistrado({
  pagamentoId,
  numeroRecibo,
  telefone,
  mensagem,
}: {
  pagamentoId: string;
  numeroRecibo: number;
  telefone: string | null;
  mensagem: string;
}) {
  const { enviar, enviando } = useEnvioArquivos({ categoria: "COMPROVANTE", pagamentoId });
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-livre/40 bg-livre/8 p-4">
      <p className="flex items-center gap-2 font-medium">
        <CheckCircle2 className="size-5 text-livre" aria-hidden="true" />
        Pagamento registrado · recibo nº {String(numeroRecibo).padStart(4, "0")}
      </p>
      <div className="flex flex-wrap gap-2">
        <BotaoCompartilharRecibo pagamentoId={pagamentoId} numero={numeroRecibo} />
        <BotaoMensagem telefone={telefone} mensagem={mensagem} rotulo="Avisar no WhatsApp" />
        <BotaoVerRecibo pagamentoId={pagamentoId} />
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-medium hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
          <Paperclip className="size-4" aria-hidden="true" />
          {enviando ? "Enviando…" : "Anexar comprovante"}
          <input
            type="file"
            accept={REGRAS.COMPROVANTE.aceitar}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) void enviar(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </section>
  );
}

function LinhaPagamento({
  pagamento: p,
  telefone,
  mensagem,
}: {
  pagamento: CobrancaLinha["pagamentos"][number];
  telefone: string | null;
  mensagem: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [desfazendo, iniciar] = useTransition();

  function desfazer() {
    iniciar(async () => {
      const r = await estornarPagamento(p.id);
      if (r.ok) toast.success("Pagamento desfeito. A cobrança voltou a ficar em aberto.");
      else toast.error(r.erro);
      setConfirmando(false);
    });
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-medium tabular-nums">{formatarMoeda(p.valorPago)}</span>
        <span className="text-sm text-muted-foreground">
          {formatarData(p.data)} · {FORMAS[p.forma]} · recibo nº {String(p.numeroRecibo).padStart(4, "0")}
        </span>
      </div>
      {p.multa + p.juros > 0 && (
        <p className="text-sm text-muted-foreground">
          Inclui multa {formatarMoeda(p.multa)} e juros {formatarMoeda(p.juros)}.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <BotaoCompartilharRecibo pagamentoId={p.id} numero={p.numeroRecibo} />
        <BotaoMensagem telefone={telefone} mensagem={mensagem} rotulo="WhatsApp" />
        <BotaoVerRecibo pagamentoId={p.id} />
        {confirmando ? (
          <span className="flex items-center gap-1">
            <Button size="sm" variant="destructive" disabled={desfazendo} onClick={desfazer}>
              Desfazer pagamento
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmando(false)}>
              Não
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setConfirmando(true)}>
            <Undo2 className="size-4" />
            Lancei errado
          </Button>
        )}
      </div>
    </li>
  );
}

/** Primeiro mês proporcional, desconto combinado, vencimento diferente: só enquanto não houver pagamento. */
function AjusteCobranca({ cobranca: c }: { cobranca: CobrancaLinha }) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(c.valor);
  const [vencimento, setVencimento] = useState(c.vencimento);
  const [descricao, setDescricao] = useState(c.descricao ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  if (!aberto) {
    return (
      <Button variant="ghost" className="self-start text-muted-foreground" onClick={() => setAberto(true)}>
        Ajustar valor ou vencimento
      </Button>
    );
  }

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await ajustarCobranca(c.id, { valor, vencimento, descricao });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      toast.success("Cobrança ajustada.");
      setAberto(false);
    });
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border p-4">
      <h3 className="font-heading text-lg">Ajustar esta cobrança</h3>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Valor
        <InputMoeda centavos={valor} aoMudar={setValor} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Vencimento
        <Input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="block" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Motivo <span className="font-normal text-muted-foreground">(opcional)</span>
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: primeiro mês proporcional" />
      </label>
      <AvisoErro mensagem={erro} />
      <div className="flex gap-2">
        <Button onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar ajuste"}
        </Button>
        <Button variant="ghost" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </section>
  );
}
