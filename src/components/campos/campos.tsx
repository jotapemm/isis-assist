"use client";

import { useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

/** Valor em reais guardado em centavos (number). Os dígitos entram pela direita, como no caixa eletrônico. */
export function CampoMoeda<T extends FieldValues>(props: Base<T> & PropsInput) {
  const { control, name, rotulo, descricao, opcional, className, ...input } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair, ref }) => (
        <Adorno prefixo="R$">
          <Input
            {...input}
            id={id}
            ref={ref}
            name={name}
            inputMode="numeric"
            aria-invalid={invalido}
            value={formatarValor(Number(valor) || 0)}
            onBlur={aoSair}
            onChange={(e) => aoMudar(centavosDeDigitos(e.target.value))}
            className="pl-11 text-right tabular-nums"
          />
        </Adorno>
      )}
    </Moldura>
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

/** Lista de opções nativa: no celular abre o seletor do próprio aparelho, que é o mais fácil de usar. */
export function CampoSelecao<T extends FieldValues>(
  props: Base<T> & { opcoes: readonly { valor: string; rotulo: string }[]; vazio?: string },
) {
  const { control, name, rotulo, descricao, opcional, className, opcoes, vazio = "Escolha…" } = props;
  return (
    <Moldura {...{ control, name, rotulo, descricao, opcional, className }}>
      {({ id, invalido, valor, aoMudar, aoSair }) => (
        <select
          id={id}
          name={name}
          aria-invalid={invalido}
          value={(valor as string) ?? ""}
          onBlur={aoSair}
          onChange={(e) => aoMudar(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:h-10 dark:bg-input/30"
        >
          <option value="">{vazio}</option>
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
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
