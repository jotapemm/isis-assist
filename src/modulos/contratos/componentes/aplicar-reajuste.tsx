"use client";

import { useState, useTransition } from "react";
import { TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AvisoErro } from "@/components/campos/campos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { mesAbreviado } from "@/lib/datas";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { aplicarReajuste, type PreviaReajuste, prepararReajuste } from "../acoes";
import { aplicarPercentual, INDICES, percentualTexto } from "../reajuste";

type Escolha = "indice" | "outro" | "manter";

/**
 * Gaveta do reajuste anual. Ao abrir, busca o índice (Banco Central) e mostra a conta;
 * a usuária aplica o índice, digita outro percentual ou mantém o valor neste ano.
 */
export function AplicarReajuste({ contratoId, destaque = false }: { contratoId: string; destaque?: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [previa, setPrevia] = useState<PreviaReajuste | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escolha, setEscolha] = useState<Escolha>("indice");
  const [outro, setOutro] = useState("");
  const [carregando, iniciarCarga] = useTransition();
  const [salvando, iniciarSalvar] = useTransition();

  function abrir(sim: boolean) {
    setAberto(sim);
    if (!sim) return;
    setPrevia(null);
    setErro(null);
    setOutro("");
    iniciarCarga(async () => {
      const r = await prepararReajuste(contratoId);
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      setPrevia(r.dados);
      // Sem índice disponível → digitar; índice negativo → o padrão é manter o valor.
      setEscolha(r.dados.percentual === null ? "outro" : r.dados.percentual < 0 ? "manter" : "indice");
    });
  }

  const percentualOutro = Number(outro.replace(",", "."));
  const percentual =
    escolha === "manter" ? 0 : escolha === "outro" ? (outro && Number.isFinite(percentualOutro) ? percentualOutro : null) : previa?.percentual ?? null;
  const valorNovo = previa && percentual !== null ? aplicarPercentual(previa.valorAtual, percentual) : null;

  function aplicar() {
    if (percentual === null) return;
    iniciarSalvar(async () => {
      const r = await aplicarReajuste(contratoId, { percentual, manterValor: escolha === "manter", observacao: "" });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      toast.success(escolha === "manter" ? "Valor mantido neste ano." : `Aluguel reajustado para ${formatarMoeda(r.dados.valorNovo)}.`);
      setAberto(false);
    });
  }

  const rotuloIndice = previa ? INDICES[previa.indice].rotulo : "";

  return (
    <Sheet open={aberto} onOpenChange={abrir}>
      <SheetTrigger asChild>
        <Button variant={destaque ? "default" : "outline"}>
          <TrendingUp className="size-4" />
          Aplicar reajuste
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Reajuste anual</SheetTitle>
          <SheetDescription>
            {previa ? `Aniversário do contrato em ${formatarData(previa.dataBase)}.` : "Calculando com o índice do contrato…"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-8">
          {carregando && (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Buscando o índice">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          )}

          {previa && (
            <>
              <div className="rounded-xl bg-muted/70 p-4">
                {previa.percentual !== null ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {previa.indice === "FIXO" ? "Percentual fixo do contrato" : `${rotuloIndice} acumulado de ${previa.periodo}`}
                    </p>
                    <p className="font-heading text-3xl tabular-nums">{percentualTexto(previa.percentual)}</p>
                  </>
                ) : (
                  <p className="text-sm">{previa.aviso}</p>
                )}
                {previa.percentual !== null && previa.aviso && <p className="mt-2 text-sm">{previa.aviso}</p>}
                {previa.meses.length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer font-medium text-primary">Ver mês a mês</summary>
                    <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 tabular-nums sm:grid-cols-3">
                      {previa.meses.map((m) => (
                        <li key={m.competencia} className="flex justify-between gap-2">
                          <span className="text-muted-foreground">{mesAbreviado(m.competencia)}</span>
                          <span>{percentualTexto(m.variacao)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-muted-foreground">Fonte: Banco Central (SGS). Os meses são compostos, não somados.</p>
                  </details>
                )}
              </div>

              <div role="radiogroup" aria-label="Como reajustar" className="flex flex-col gap-2">
                {previa.percentual !== null && (
                  <Opcao marcada={escolha === "indice"} aoEscolher={() => setEscolha("indice")}>
                    Aplicar {percentualTexto(previa.percentual)}
                  </Opcao>
                )}
                <Opcao marcada={escolha === "outro"} aoEscolher={() => setEscolha("outro")}>
                  Usar outro percentual
                </Opcao>
                {escolha === "outro" && (
                  <label className="ml-1 flex items-center gap-2 text-sm">
                    Percentual
                    <div className="relative">
                      <Input
                        inputMode="decimal"
                        autoFocus
                        value={outro}
                        onChange={(e) => setOutro(e.target.value.replace(/[^\d,.-]/g, ""))}
                        className="w-28 pr-7 tabular-nums"
                        aria-label="Percentual do reajuste"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                    </div>
                  </label>
                )}
                <Opcao marcada={escolha === "manter"} aoEscolher={() => setEscolha("manter")}>
                  Manter o valor este ano
                </Opcao>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Aluguel hoje</p>
                  <p className="tabular-nums">{formatarMoeda(previa.valorAtual)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Passa a ser</p>
                  <p className="font-heading text-2xl tabular-nums">{valorNovo !== null ? formatarMoeda(valorNovo) : "—"}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">O valor novo vale para as cobranças a partir de {formatarData(previa.dataBase)}. O próximo aviso vem daqui a um ano.</p>
            </>
          )}

          <AvisoErro mensagem={erro} />
          {previa && (
            <Button size="lg" onClick={aplicar} disabled={percentual === null || salvando}>
              {salvando ? "Salvando…" : escolha === "manter" ? "Manter o valor" : "Aplicar reajuste"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Opcao({ marcada, aoEscolher, children }: { marcada: boolean; aoEscolher: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={marcada}
      onClick={aoEscolher}
      className={cn(
        "flex items-center gap-3 rounded-xl border-2 px-3 py-3 text-left font-medium transition-colors",
        marcada ? "border-primary bg-secondary" : "border-border hover:bg-muted/60",
      )}
    >
      <span className={cn("flex size-5 items-center justify-center rounded-full border-2", marcada ? "border-primary" : "border-input")}>
        {marcada && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      {children}
    </button>
  );
}
