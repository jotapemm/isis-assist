"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Search, UserPlus } from "lucide-react";
import { AvisoErro, CampoAreaTexto, CampoMoeda, CampoTexto } from "@/components/campos/campos";
import { useEnviar } from "@/components/campos/use-enviar";
import { Avatar } from "@/components/layout/menu-usuario";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { fimDoContrato, mesesEntre, somarMeses } from "@/lib/datas";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { mascararCPF, mascararTelefone, somenteDigitos } from "@/lib/mascaras";
import { cn } from "@/lib/utils";
import { STATUS } from "@/modulos/apartamentos/status";
import { criarContrato } from "../acoes";
import type { DadosAssistente } from "../consultas";
import { type DadosNovoContrato, esquemaNovoContrato } from "../esquemas";
import { INDICES } from "../reajuste";
import { CampoCaucao, CampoFiador, CampoPrazo, CampoReajuste, CampoVencimento } from "./campos-contrato";

const PASSOS = ["Apartamento", "Inquilino", "Valores e prazo", "Confirmar"] as const;

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Novo contrato em 4 passos. Tocar no apto ou no inquilino já avança; valores vêm pré-preenchidos
 * (aluguel de referência do apto, dia 10, 12 meses, IGP-M). Nada é gravado até "Ativar contrato".
 */
export function AssistenteContrato({
  dados,
  hoje,
  apartamentoInicial,
  inquilinoInicial,
}: {
  dados: DadosAssistente;
  hoje: string;
  apartamentoInicial?: string;
  inquilinoInicial?: string;
}) {
  const aptoInicial = dados.aptos.find((a) => a.id === apartamentoInicial && !a.inquilinoAtual);
  const inqInicial = dados.inquilinos.find((i) => i.id === inquilinoInicial);

  const form = useForm<DadosNovoContrato>({
    resolver: zodResolver(esquemaNovoContrato),
    defaultValues: {
      apartamentoId: aptoInicial?.id ?? "",
      inquilinoId: inqInicial?.id ?? "",
      cadastrarInquilino: dados.inquilinos.length === 0,
      novoInquilino: { nome: "", cpf: "", telefone: "" },
      dataInicio: hoje,
      dataFim: fimDoContrato(hoje, 12),
      valorAluguel: aptoInicial?.valorReferencia ?? 0,
      diaVencimento: 10,
      valorCaucao: 0,
      indiceReajuste: "IGPM",
      percentualFixo: "",
      fiadorId: inqInicial?.fiador?.id ?? "",
      observacoes: "",
    },
  });
  const { enviar, pendente, erro } = useEnviar(form, criarContrato, "Contrato ativado.", { sempreMostrarErro: true });

  const [passo, setPasso] = useState(aptoInicial ? (inqInicial ? 2 : 1) : 0);
  const valores = useWatch({ control: form.control });
  const apto = dados.aptos.find((a) => a.id === valores.apartamentoId);
  const inquilino = dados.inquilinos.find((i) => i.id === valores.inquilinoId);

  function escolherApto(id: string) {
    const escolhido = dados.aptos.find((a) => a.id === id)!;
    form.setValue("apartamentoId", id);
    if (escolhido.valorReferencia) form.setValue("valorAluguel", escolhido.valorReferencia);
    setPasso(1);
  }

  function escolherInquilino(id: string) {
    const escolhido = dados.inquilinos.find((i) => i.id === id)!;
    form.setValue("inquilinoId", id);
    form.setValue("cadastrarInquilino", false);
    form.setValue("fiadorId", escolhido.fiador?.id ?? "");
    form.clearErrors("inquilinoId");
    setPasso(2);
  }

  async function continuarComNovo() {
    form.setValue("cadastrarInquilino", true);
    form.setValue("inquilinoId", "");
    form.setValue("fiadorId", "");
    if (await form.trigger(["novoInquilino.nome", "novoInquilino.cpf", "novoInquilino.telefone"])) setPasso(2);
  }

  async function continuarValores() {
    const ok = await form.trigger([
      "valorAluguel",
      "diaVencimento",
      "dataInicio",
      "dataFim",
      "valorCaucao",
      "indiceReajuste",
      "percentualFixo",
    ]);
    if (ok) setPasso(3);
  }

  const nomeInquilino = valores.cadastrarInquilino ? valores.novoInquilino?.nome : inquilino?.nome;

  return (
    <div className="max-w-3xl">
      {/* Progresso: os passos são uma sequência de verdade, por isso numerados. */}
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Passos">
        {PASSOS.map((nome, i) => (
          <li key={nome} aria-current={i === passo ? "step" : undefined} className="flex flex-col gap-1.5">
            <span className={cn("h-1.5 rounded-full bg-muted", i <= passo && "bg-primary")} />
            <span
              className={cn(
                "hidden text-xs sm:block",
                i === passo ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {i + 1}. {nome}
            </span>
          </li>
        ))}
      </ol>
      <p className="mb-1 text-sm text-muted-foreground sm:hidden">
        Passo {passo + 1} de 4 · {PASSOS[passo]}
      </p>

      {passo > 0 && (
        <button
          type="button"
          onClick={() => setPasso(passo - 1)}
          className="-ml-1 mb-2 inline-flex h-9 items-center gap-1 rounded-lg pr-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Voltar
        </button>
      )}

      {passo === 0 && (
        <PassoApartamento dados={dados} selecionado={valores.apartamentoId ?? ""} aoEscolher={escolherApto} />
      )}

      {passo === 1 && (
        <section>
          <h2 className="mb-4 font-heading text-2xl">Quem vai morar no apto {apto?.identificacao}?</h2>
          {valores.cadastrarInquilino ? (
            <div className="flex flex-col gap-5 rounded-2xl border bg-card p-4 sm:p-5">
              <p className="text-sm text-muted-foreground">
                O cadastro completo (documentos, fiador, contato de emergência) pode ser feito depois, na página do
                inquilino.
              </p>
              <FieldGroup className="grid gap-5 sm:grid-cols-2">
                <CampoTexto
                  control={form.control}
                  name="novoInquilino.nome"
                  rotulo="Nome completo"
                  autoCapitalize="words"
                  autoFocus
                  className="sm:col-span-2"
                />
                <CampoTexto
                  control={form.control}
                  name="novoInquilino.cpf"
                  rotulo="CPF"
                  opcional
                  inputMode="numeric"
                  mascara={mascararCPF}
                />
                <CampoTexto
                  control={form.control}
                  name="novoInquilino.telefone"
                  rotulo="Celular"
                  opcional
                  inputMode="tel"
                  mascara={mascararTelefone}
                />
              </FieldGroup>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                {dados.inquilinos.length > 0 && (
                  <Button type="button" variant="ghost" onClick={() => form.setValue("cadastrarInquilino", false)}>
                    Escolher alguém já cadastrado
                  </Button>
                )}
                <Button type="button" size="lg" onClick={continuarComNovo}>
                  Continuar
                </Button>
              </div>
            </div>
          ) : (
            <PassoInquilino
              dados={dados}
              selecionado={valores.inquilinoId ?? ""}
              aoEscolher={escolherInquilino}
              aoCadastrarNovo={() => form.setValue("cadastrarInquilino", true)}
            />
          )}
        </section>
      )}

      {passo === 2 && (
        <section className="flex flex-col gap-7">
          <h2 className="font-heading text-2xl">Valores e prazo</h2>
          <CampoMoeda
            control={form.control}
            name="valorAluguel"
            rotulo="Aluguel mensal"
            descricao={
              apto?.valorReferencia
                ? `Referência do apto ${apto.identificacao}: ${formatarMoeda(apto.valorReferencia)}.`
                : undefined
            }
            className="sm:max-w-64"
          />
          <CampoVencimento control={form.control} />
          <CampoPrazo control={form.control} />
          <CampoCaucao control={form.control} aluguel={valores.valorAluguel ?? 0} />
          <CampoReajuste control={form.control} />
          <CampoFiador
            control={form.control}
            fiador={valores.cadastrarInquilino ? null : (inquilino?.fiador ?? null)}
          />
          <CampoAreaTexto
            control={form.control}
            name="observacoes"
            rotulo="Observações"
            opcional
            placeholder="Ex.: inclui uma vaga de garagem; água rateada"
          />
          <Button type="button" size="lg" onClick={continuarValores} className="sm:self-start">
            Continuar
          </Button>
        </section>
      )}

      {passo === 3 && apto && (
        <section className="flex flex-col gap-5">
          <h2 className="font-heading text-2xl">Confira e ative</h2>
          <dl className="divide-y rounded-2xl border bg-card">
            <Linha rotulo="Apartamento" valor={`Apto ${apto.identificacao}`} aoAlterar={() => setPasso(0)} />
            <Linha
              rotulo="Inquilino"
              valor={
                valores.cadastrarInquilino ? (
                  <>
                    {nomeInquilino} <span className="text-sm text-muted-foreground">(cadastro novo)</span>
                  </>
                ) : (
                  nomeInquilino
                )
              }
              aoAlterar={() => setPasso(1)}
            />
            <Linha
              rotulo="Aluguel"
              valor={`${formatarMoeda(valores.valorAluguel ?? 0)}, todo dia ${valores.diaVencimento}`}
              aoAlterar={() => setPasso(2)}
            />
            <Linha
              rotulo="Prazo"
              valor={`${formatarData(valores.dataInicio!)} a ${formatarData(valores.dataFim!)} (${mesesEntre(valores.dataInicio!, valores.dataFim!)} meses)`}
              aoAlterar={() => setPasso(2)}
            />
            <Linha
              rotulo="Caução"
              valor={valores.valorCaucao ? formatarMoeda(valores.valorCaucao) : "Sem caução"}
              aoAlterar={() => setPasso(2)}
            />
            <Linha
              rotulo="Reajuste"
              valor={
                valores.indiceReajuste === "NENHUM"
                  ? "Sem reajuste"
                  : `${valores.indiceReajuste === "FIXO" ? `${valores.percentualFixo}% ao ano` : INDICES[valores.indiceReajuste!].rotulo}, a partir de ${formatarData(somarMeses(valores.dataInicio!, 12))}`
              }
              aoAlterar={() => setPasso(2)}
            />
            {valores.fiadorId && inquilino?.fiador && (
              <Linha rotulo="Fiador" valor={inquilino.fiador.nome} aoAlterar={() => setPasso(2)} />
            )}
          </dl>

          <p className="rounded-xl bg-muted/70 px-4 py-3 text-sm">
            Ao ativar, o apto {apto.identificacao} passa para <strong className={STATUS.OCUPADO.texto}>Ocupado</strong>
            {valores.cadastrarInquilino && ` e ${nomeInquilino?.split(" ")[0]} entra na lista de inquilinos`}.
          </p>
          <AvisoErro mensagem={erro} />
          <Button size="lg" onClick={enviar} disabled={pendente} className="sm:self-start">
            {pendente ? "Ativando…" : "Ativar contrato"}
          </Button>
        </section>
      )}
    </div>
  );
}

function Linha({ rotulo, valor, aoAlterar }: { rotulo: string; valor: React.ReactNode; aoAlterar: () => void }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:gap-4">
        <dt className="text-sm text-muted-foreground sm:w-28 sm:shrink-0 sm:pt-0.5">{rotulo}</dt>
        <dd className="font-medium">{valor}</dd>
      </div>
      <button
        type="button"
        onClick={aoAlterar}
        className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Alterar
      </button>
    </div>
  );
}

function PassoApartamento({
  dados,
  selecionado,
  aoEscolher,
}: {
  dados: DadosAssistente;
  selecionado: string;
  aoEscolher: (id: string) => void;
}) {
  const disponiveis = dados.aptos.filter((a) => a.status === "LIVRE" || a.status === "RESERVADO");
  const emObra = dados.aptos.filter((a) => !a.inquilinoAtual && (a.status === "REFORMA" || a.status === "MANUTENCAO"));
  const alugados = dados.aptos.filter((a) => a.inquilinoAtual);

  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-heading text-2xl">Qual apartamento?</h2>
      {disponiveis.length === 0 && emObra.length === 0 ? (
        <p className="rounded-2xl border bg-card px-4 py-8 text-center text-muted-foreground">
          Todos os apartamentos estão alugados. Para alugar um deles de novo, encerre o contrato atual primeiro.
        </p>
      ) : (
        <>
          {disponiveis.length > 0 && (
            <GradeAptos aptos={disponiveis} selecionado={selecionado} aoEscolher={aoEscolher} />
          )}
          {emObra.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                Em obra ou conserto — dá para alugar, e eles passam para Ocupado:
              </p>
              <GradeAptos aptos={emObra} selecionado={selecionado} aoEscolher={aoEscolher} />
            </div>
          )}
        </>
      )}
      {alugados.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {alugados.length === 1
            ? "1 apartamento alugado não aparece"
            : `${alugados.length} apartamentos alugados não aparecem`}{" "}
          aqui.
        </p>
      )}
    </section>
  );
}

function PassoInquilino({
  dados,
  selecionado,
  aoEscolher,
  aoCadastrarNovo,
}: {
  dados: DadosAssistente;
  selecionado: string;
  aoEscolher: (id: string) => void;
  aoCadastrarNovo: () => void;
}) {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());
  const digitos = somenteDigitos(busca);
  // Quem ainda não tem apartamento aparece primeiro: é quem costuma estar chegando.
  const lista = dados.inquilinos
    .filter(
      (i) =>
        !termo ||
        normalizar(i.nome).includes(termo) ||
        (digitos.length >= 3 && ((i.cpf ?? "").includes(digitos) || (i.telefone ?? "").includes(digitos))),
    )
    .sort((a, b) => Number(a.aptosAtuais.length > 0) - Number(b.aptosAtuais.length > 0));

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="outline" size="lg" onClick={aoCadastrarNovo} className="justify-start">
        <UserPlus className="size-5" />
        Cadastrar alguém novo
      </Button>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar inquilino já cadastrado"
          aria-label="Buscar inquilino"
          className="pl-9"
        />
      </div>
      <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
        {lista.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              onClick={() => aoEscolher(i.id)}
              aria-pressed={selecionado === i.id}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60",
                selecionado === i.id && "bg-secondary",
              )}
            >
              <Avatar nome={i.nome} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{i.nome}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {[i.telefone && mascararTelefone(i.telefone), i.fiador && "com fiador"].filter(Boolean).join(" · ") ||
                    "Sem telefone"}
                </span>
              </span>
              {i.aptosAtuais.length > 0 && (
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Já mora no {i.aptosAtuais.join(", ")}
                </span>
              )}
            </button>
          </li>
        ))}
        {lista.length === 0 && (
          <li className="px-4 py-6 text-center text-muted-foreground">Ninguém encontrado com &ldquo;{busca}&rdquo;.</li>
        )}
      </ul>
    </div>
  );
}

function GradeAptos({
  aptos,
  selecionado,
  aoEscolher,
}: {
  aptos: DadosAssistente["aptos"];
  selecionado: string;
  aoEscolher: (id: string) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
      {aptos.map((a) => {
        const info = STATUS[a.status];
        const Icone = info.icone;
        return (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => aoEscolher(a.id)}
              aria-pressed={selecionado === a.id}
              className={cn(
                "flex w-full flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-shadow hover:shadow-md",
                info.fundo,
                info.borda,
                selecionado === a.id && "ring-3 ring-primary/60",
              )}
            >
              <span className="font-mono text-lg leading-none font-bold tabular-nums">{a.identificacao}</span>
              <span className={cn("flex items-center gap-1 text-xs font-semibold", info.texto)}>
                <Icone className="size-3.5" aria-hidden="true" />
                {info.rotulo}
              </span>
              {a.valorReferencia !== null && (
                <span className="text-xs text-muted-foreground tabular-nums">{formatarMoeda(a.valorReferencia)}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
