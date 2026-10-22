"use client";

import { type Control, type FieldValues, type Path, useController } from "react-hook-form";
import { InputMoeda } from "@/components/campos/campos";
import { Escolha } from "@/components/campos/escolha";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { fimDoContrato, mesesEntre } from "@/lib/datas";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import { INDICES } from "../reajuste";

// Campos compartilhados pelo assistente de novo contrato e pela edição. Funcionam com qualquer
// formulário que tenha os campos de mesmo nome (dataFim, diaVencimento, valorCaucao…).

function Pergunta({ titulo, ajuda, children }: { titulo: string; ajuda?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="font-medium">{titulo}</p>
        {ajuda && <p className="text-sm text-muted-foreground">{ajuda}</p>}
      </div>
      {children}
    </div>
  );
}

export function CampoVencimento<T extends FieldValues>({ control }: { control: Control<T> }) {
  const { field, fieldState } = useController({ control, name: "diaVencimento" as Path<T> });
  const comuns = [5, 10, 15, 20, 25];
  return (
    <Pergunta titulo="Dia do vencimento" ajuda="Em meses mais curtos, o vencimento cai no último dia do mês.">
      <div className="flex flex-wrap items-center gap-2">
        <Escolha
          rotulo="Dia do vencimento"
          opcoes={comuns.map((d) => ({ valor: d, rotulo: `Dia ${d}` }))}
          valor={comuns.includes(field.value) ? field.value : null}
          aoMudar={field.onChange}
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          ou dia
          <Input
            inputMode="numeric"
            aria-label="Outro dia de vencimento"
            value={field.value ? String(field.value) : ""}
            onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, "").slice(0, 2)) || 0)}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            className="w-16 text-center tabular-nums"
          />
        </label>
      </div>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Pergunta>
  );
}

/** Início (opcional — na edição ele não muda), duração em um toque e término. */
export function CampoPrazo<T extends FieldValues>({ control, inicioFixo }: { control: Control<T>; inicioFixo?: string }) {
  const inicioCtl = useController({ control, name: "dataInicio" as Path<T>, disabled: Boolean(inicioFixo) });
  const fimCtl = useController({ control, name: "dataFim" as Path<T> });
  const inicio: string = inicioFixo ?? inicioCtl.field.value;
  const fim: string = fimCtl.field.value;
  const duracao = inicio && fim > inicio ? mesesEntre(inicio, fim) : null;

  return (
    <Pergunta
      titulo="Prazo"
      ajuda={duracao ? `${duracao} meses: de ${formatarData(inicio)} a ${formatarData(fim)}.` : "Escolha o início e quanto tempo dura."}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {!inicioFixo && (
          <label className="flex flex-col gap-1.5 text-sm">
            Começa em
            <Input
              type="date"
              value={inicio}
              onChange={(e) => {
                inicioCtl.field.onChange(e.target.value);
                // Mantém a duração escolhida quando o início muda.
                if (duracao && e.target.value) fimCtl.field.onChange(fimDoContrato(e.target.value, duracao));
              }}
              aria-invalid={inicioCtl.fieldState.invalid}
              className="block"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm">
          Termina em
          <Input
            type="date"
            value={fim}
            onChange={(e) => fimCtl.field.onChange(e.target.value)}
            aria-invalid={fimCtl.fieldState.invalid}
            className="block"
          />
        </label>
      </div>
      <Escolha
        rotulo="Duração"
        opcoes={[12, 24, 30, 36].map((m) => ({ valor: m, rotulo: `${m} meses` }))}
        valor={duracao}
        aoMudar={(meses) => inicio && fimCtl.field.onChange(fimDoContrato(inicio, meses))}
      />
      {inicioCtl.fieldState.error && <FieldError errors={[inicioCtl.fieldState.error]} />}
      {fimCtl.fieldState.error && <FieldError errors={[fimCtl.fieldState.error]} />}
    </Pergunta>
  );
}

export function CampoCaucao<T extends FieldValues>({ control, aluguel }: { control: Control<T>; aluguel: number }) {
  const { field, fieldState } = useController({ control, name: "valorCaucao" as Path<T> });
  const multiplo = aluguel > 0 && field.value % aluguel === 0 ? field.value / aluguel : null;
  return (
    <Pergunta titulo="Caução" ajuda="Depósito de garantia. A lei permite até 3 aluguéis.">
      <Escolha
        rotulo="Caução"
        opcoes={[
          { valor: 0, rotulo: "Sem caução" },
          { valor: 1, rotulo: "1 aluguel" },
          { valor: 2, rotulo: "2 aluguéis" },
          { valor: 3, rotulo: "3 aluguéis" },
        ]}
        valor={field.value === 0 ? 0 : multiplo}
        aoMudar={(n) => field.onChange(n * aluguel)}
      />
      <InputMoeda
        aria-label="Valor da caução"
        centavos={field.value}
        aoMudar={field.onChange}
        onBlur={field.onBlur}
        aria-invalid={fieldState.invalid}
        className="sm:max-w-56"
      />
      {aluguel > 0 && field.value > aluguel * 3 && (
        <p className="text-sm text-reservado">Passa de 3 aluguéis ({formatarMoeda(aluguel * 3)}). Confira.</p>
      )}
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Pergunta>
  );
}

export function CampoReajuste<T extends FieldValues>({ control }: { control: Control<T> }) {
  const indice = useController({ control, name: "indiceReajuste" as Path<T> });
  const fixo = useController({ control, name: "percentualFixo" as Path<T> });
  return (
    <Pergunta titulo="Reajuste anual" ajuda="O sistema avisa 30 dias antes de cada aniversário do contrato e calcula o novo valor.">
      <div role="radiogroup" aria-label="Índice de reajuste" className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(INDICES) as (keyof typeof INDICES)[]).map((chave) => {
          const marcado = indice.field.value === chave;
          return (
            <button
              key={chave}
              type="button"
              role="radio"
              aria-checked={marcado}
              onClick={() => indice.field.onChange(chave)}
              className={cn(
                "flex flex-col rounded-xl border-2 px-3 py-2.5 text-left transition-colors",
                marcado ? "border-primary bg-secondary" : "border-border hover:bg-muted/60",
              )}
            >
              <span className="font-semibold">{INDICES[chave].rotulo}</span>
              <span className="text-sm text-muted-foreground">{INDICES[chave].descricao}</span>
            </button>
          );
        })}
      </div>
      {indice.field.value === "FIXO" && (
        <label className="flex items-center gap-2 text-sm">
          Percentual ao ano
          <div className="relative">
            <Input
              inputMode="decimal"
              value={fixo.field.value}
              onChange={(e) => fixo.field.onChange(e.target.value.replace(/[^\d,.]/g, ""))}
              onBlur={fixo.field.onBlur}
              aria-invalid={fixo.fieldState.invalid}
              className="w-24 pr-7 tabular-nums"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
          </div>
        </label>
      )}
      {fixo.fieldState.error && <FieldError errors={[fixo.fieldState.error]} />}
    </Pergunta>
  );
}

/** Aparece só se o inquilino tem fiador cadastrado. */
export function CampoFiador<T extends FieldValues>({
  control,
  fiador,
}: {
  control: Control<T>;
  fiador: { id: string; nome: string } | null;
}) {
  const { field } = useController({ control, name: "fiadorId" as Path<T> });
  if (!fiador) return null;
  return (
    <label className="flex items-start gap-3">
      <Switch checked={field.value === fiador.id} onCheckedChange={(sim) => field.onChange(sim ? fiador.id : "")} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">Fiador: {fiador.nome}</span>
        <span className="text-sm text-muted-foreground">Fica registrado como garantia deste contrato.</span>
      </span>
    </label>
  );
}
