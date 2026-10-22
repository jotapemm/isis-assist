"use client";

import { useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Eye, EyeOff, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatarValor } from "@/lib/formatar";
import { centavosDeDigitos } from "@/lib/mascaras";
import { cn } from "@/lib/utils";

type Base<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  rotulo: string;
  descricao?: string;
  opcional?: boolean;
  className?: string;
};

type PropsInput = Omit<React.ComponentProps<typeof Input>, "name" | "value" | "onChange" | "defaultValue">;

/** Moldura comum: rótulo, campo, ajuda e erro em português, ligados ao react-hook-form. */
function Moldura<T extends FieldValues>({
  control,
  name,
  rotulo,
  descricao,
  opcional,
  className,
  children,
}: Base<T> & {
  children: (args: {
    id: string;
    invalido: boolean;
    valor: unknown;
    aoMudar: (valor: unknown) => void;
    aoSair: () => void;
    ref: React.Ref<HTMLInputElement>;
  }) => React.ReactNode;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldLabel htmlFor={name}>
            {rotulo}
            {opcional && <span className="font-normal text-muted-foreground">(opcional)</span>}
          </FieldLabel>
          {children({
            id: name,
            invalido: fieldState.invalid,
            valor: field.value,
            aoMudar: field.onChange,
            aoSair: field.onBlur,
            ref: field.ref,
          })}
          {descricao && !fieldState.invalid && <FieldDescription>{descricao}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function CampoTexto<T extends FieldValues>({
  mascara,
  ...props
}: Base<T> & PropsInput & { mascara?: (texto: string) => string }) {
  const { control, name, rotulo, descricao, opcional, className, ...input } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair, ref }) => (
        <Input
          {...input}
          id={id}
          ref={ref}
          name={name}
          aria-invalid={invalido}
          value={(valor as string) ?? ""}
          onBlur={aoSair}
          onChange={(e) => aoMudar(mascara ? mascara(e.target.value) : e.target.value)}
        />
      )}
    </Moldura>
  );
}

export function CampoSenha<T extends FieldValues>(props: Base<T> & PropsInput) {
  const { control, name, rotulo, descricao, opcional, className, ...input } = props;
  const [visivel, setVisivel] = useState(false);
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair, ref }) => (
        <div className="relative">
          <Input
            {...input}
            id={id}
            ref={ref}
            name={name}
            type={visivel ? "text" : "password"}
            aria-invalid={invalido}
            value={(valor as string) ?? ""}
            onBlur={aoSair}
            onChange={(e) => aoMudar(e.target.value)}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:outline-2"
            aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          >
            {visivel ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      )}
    </Moldura>
  );
}

/** Campo de reais solto (fora do react-hook-form). Valor em centavos; os dígitos entram pela direita. */
export function InputMoeda({
  centavos,
  aoMudar,
  ...input
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & { centavos: number; aoMudar: (centavos: number) => void }) {
  return (
    <Adorno prefixo="R$">
      <Input
        {...input}
        inputMode="numeric"
        value={formatarValor(centavos || 0)}
        onChange={(e) => aoMudar(centavosDeDigitos(e.target.value))}
        className="pl-11 text-right tabular-nums"
      />
    </Adorno>
  );
}

/** Valor em reais guardado em centavos (number). Os dígitos entram pela direita, como no caixa eletrônico. */
export function CampoMoeda<T extends FieldValues>(props: Base<T> & PropsInput) {
  const { control, name, rotulo, descricao, opcional, className, ...input } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair, ref }) => (
        <InputMoeda
          {...input}
          id={id}
          ref={ref}
          name={name}
          aria-invalid={invalido}
          centavos={Number(valor) || 0}
          onBlur={aoSair}
          aoMudar={aoMudar}
        />
      )}
    </Moldura>
  );
}

/** Texto longo (descrição, observações). Cresce conforme a pessoa escreve. */
export function CampoAreaTexto<T extends FieldValues>(
  props: Base<T> & Omit<React.ComponentProps<typeof Textarea>, "name" | "value" | "onChange" | "defaultValue">,
) {
  const { control, name, rotulo, descricao, opcional, className, ...area } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair }) => (
        <Textarea
          {...area}
          id={id}
          name={name}
          aria-invalid={invalido}
          value={(valor as string) ?? ""}
          onBlur={aoSair}
          onChange={(e) => aoMudar(e.target.value)}
        />
      )}
    </Moldura>
  );
}

/** Data com o calendário do próprio aparelho. O valor é "AAAA-MM-DD"; a tela mostra dd/mm/aaaa. */
export function CampoData<T extends FieldValues>(props: Base<T> & Omit<PropsInput, "type">) {
  const { control, name, rotulo, descricao, opcional, className, ...input } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair, ref }) => (
        <Input
          {...input}
          type="date"
          id={id}
          ref={ref}
          name={name}
          aria-invalid={invalido}
          value={(valor as string) ?? ""}
          onBlur={aoSair}
          onChange={(e) => aoMudar(e.target.value)}
          className="block"
        />
      )}
    </Moldura>
  );
}

/** Pergunta de sim/não com explicação ao lado. */
export function CampoInterruptor<T extends FieldValues>({
  control,
  name,
  rotulo,
  descricao,
  className,
}: Omit<Base<T>, "opcional">) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal" className={cn("items-start", className)}>
          <Switch id={name} checked={Boolean(field.value)} onCheckedChange={field.onChange} className="mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <FieldLabel htmlFor={name}>{rotulo}</FieldLabel>
            {descricao && <FieldDescription>{descricao}</FieldDescription>}
          </div>
        </Field>
      )}
    />
  );
}

/** Número com botões − e + grandes (bons para o dedo); também aceita digitar. */
export function Contador({
  id,
  rotulo,
  valor,
  aoMudar,
  minimo = 0,
  maximo = 99,
}: {
  id: string;
  rotulo: string;
  valor: number;
  aoMudar: (valor: number) => void;
  minimo?: number;
  maximo?: number;
}) {
  const limitar = (n: number) => Math.min(maximo, Math.max(minimo, Number.isFinite(n) ? n : minimo));
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" aria-label={`Diminuir ${rotulo.toLowerCase()}`} disabled={valor <= minimo} onClick={() => aoMudar(limitar(valor - 1))}>
          <Minus className="size-5" />
        </Button>
        <Input
          id={id}
          inputMode="numeric"
          value={String(valor)}
          onChange={(e) => aoMudar(limitar(Number(e.target.value.replace(/\D/g, "")) || minimo))}
          className="w-16 text-center font-mono text-lg font-bold tabular-nums"
        />
        <Button type="button" variant="outline" size="icon" aria-label={`Aumentar ${rotulo.toLowerCase()}`} disabled={valor >= maximo} onClick={() => aoMudar(limitar(valor + 1))}>
          <Plus className="size-5" />
        </Button>
      </div>
    </div>
  );
}

/** Percentual digitado como texto ("2,5"); a conversão para número acontece no esquema. */
export function CampoPercentual<T extends FieldValues>(props: Base<T> & PropsInput & { sufixo?: string }) {
  const { control, name, rotulo, descricao, opcional, className, sufixo = "%", ...input } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair, ref }) => (
        <Adorno sufixo={sufixo}>
          <Input
            {...input}
            id={id}
            ref={ref}
            name={name}
            inputMode="decimal"
            aria-invalid={invalido}
            value={(valor as string) ?? ""}
            onBlur={aoSair}
            onChange={(e) => aoMudar(e.target.value.replace(/[^\d,.]/g, ""))}
            className="pr-16 tabular-nums"
          />
        </Adorno>
      )}
    </Moldura>
  );
}

// O Radix não aceita item com valor vazio; "Não informar" usa este marcador e vira "" no formulário.
const NAO_INFORMAR = "__nao_informar__";

/** Lista de opções que abre logo abaixo do campo, com rolagem quando é longa (ex.: os 27 estados). */
export function CampoSelecao<T extends FieldValues>(
  props: Base<T> & {
    opcoes: readonly { valor: string; rotulo: string }[];
    vazio?: string;
    /** Mostra "Não informar" no topo da lista, para desfazer a escolha. */
    limpavel?: boolean;
  },
) {
  const { control, name, rotulo, descricao, opcional, className, opcoes, vazio = "Escolha", limpavel } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair, ref }) => (
        <Select
          value={(valor as string) ?? ""}
          onValueChange={(v) => aoMudar(v === NAO_INFORMAR ? "" : v)}
          onOpenChange={(aberto) => !aberto && aoSair()}
        >
          <SelectTrigger id={id} ref={ref as React.Ref<HTMLButtonElement>} aria-invalid={invalido} className="w-full">
            <SelectValue placeholder={vazio} />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            {limpavel && valor ? (
              <SelectItem value={NAO_INFORMAR} className="text-muted-foreground">
                Não informar
              </SelectItem>
            ) : null}
            {opcoes.map((o) => (
              <SelectItem key={o.valor} value={o.valor}>
                {o.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </Moldura>
  );
}

function Adorno({ prefixo, sufixo, children }: { prefixo?: string; sufixo?: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {prefixo && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">{prefixo}</span>
      )}
      {children}
      {sufixo && (
        <span className={cn("pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground")}>
          {sufixo}
        </span>
      )}
    </div>
  );
}

/** Erro geral do formulário (ex.: "E-mail ou senha não conferem"). */
export function AvisoErro({ mensagem }: { mensagem?: string | null }) {
  if (!mensagem) return null;
  return (
    <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      {mensagem}
    </p>
  );
}
