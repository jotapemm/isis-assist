"use client";

import { useState } from "react";
import { CalendarRange, FileSpreadsheet, FileText, Landmark, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Os três relatórios: escolhe o período e baixa em PDF ou Excel. */
export function EscolhaRelatorios({ hoje }: { hoje: string }) {
  const anoAtual = Number(hoje.slice(0, 4));
  const anos = [anoAtual, anoAtual - 1, anoAtual - 2];
  const [mes, setMes] = useState(hoje.slice(0, 7));
  const [ano, setAno] = useState(String(anoAtual));
  // O IR que se declara é o do ano anterior; o do ano em curso serve para ir acompanhando.
  const [anoIR, setAnoIR] = useState(String(anoAtual - 1));

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Cartao
        icone={FileText}
        titulo="Relatório do mês"
        descricao="O que entrou, o que saiu e a situação dos aluguéis do mês, recibo por recibo."
        tipo="mensal"
        periodo={mes}
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Mês
          <Input type="month" value={mes} max={hoje.slice(0, 7)} onChange={(e) => setMes(e.target.value)} className="block" />
        </label>
      </Cartao>

      <Cartao
        icone={CalendarRange}
        titulo="Relatório do ano"
        descricao="Mês a mês, o resultado de cada imóvel e as despesas por categoria."
        tipo="anual"
        periodo={ano}
      >
        <EscolhaAno valor={ano} anos={anos} aoMudar={setAno} />
      </Cartao>

      <Cartao
        icone={Landmark}
        titulo="Informe de IR"
        descricao="Para o contador e o carnê-leão: quanto cada inquilino pagou em cada mês, com o CPF, e o IPTU e o condomínio dedutíveis."
        tipo="ir"
        periodo={anoIR}
      >
        <EscolhaAno valor={anoIR} anos={anos} aoMudar={setAnoIR} rotulo="Ano-calendário" />
      </Cartao>
    </div>
  );
}

function EscolhaAno({ valor, anos, aoMudar, rotulo = "Ano" }: { valor: string; anos: number[]; aoMudar: (v: string) => void; rotulo?: string }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium">
      {rotulo}
      <Select value={valor} onValueChange={aoMudar}>
        <SelectTrigger className="w-full" aria-label={rotulo}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {anos.map((a) => (
            <SelectItem key={a} value={String(a)}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Cartao({
  icone: Icone,
  titulo,
  descricao,
  tipo,
  periodo,
  children,
}: {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  tipo: "mensal" | "anual" | "ir";
  periodo: string;
  children: React.ReactNode;
}) {
  const href = (formato: "pdf" | "xlsx") => `/api/relatorios/${tipo}?periodo=${periodo}&formato=${formato}`;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Icone className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-heading text-lg">{titulo}</h2>
          <p className="text-sm text-muted-foreground">{descricao}</p>
        </div>
      </div>
      {children}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button asChild disabled={!periodo}>
          <a href={href("pdf")} target="_blank" rel="noopener">
            <FileText className="size-4" />
            Ver PDF
          </a>
        </Button>
        <Button asChild variant="outline" disabled={!periodo}>
          <a href={href("xlsx")} download>
            <FileSpreadsheet className="size-4" />
            Baixar Excel
          </a>
        </Button>
      </div>
    </section>
  );
}
