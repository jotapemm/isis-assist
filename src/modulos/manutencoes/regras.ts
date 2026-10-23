// Regras das manutenções — puras (sem banco), para testar e para o navegador mostrar na hora.
import { diasEntre } from "@/lib/datas";

export const PRIORIDADES_OS = ["BAIXA", "MEDIA", "ALTA", "URGENTE"] as const;
export type PrioridadeOS = (typeof PRIORIDADES_OS)[number];

export const PRIORIDADE: Record<PrioridadeOS, { rotulo: string; classe: string; peso: number }> = {
  URGENTE: { rotulo: "Urgente", classe: "border-destructive/40 bg-destructive/10 text-destructive", peso: 0 },
  ALTA: { rotulo: "Alta", classe: "border-reservado/50 bg-reservado/12 text-reservado", peso: 1 },
  MEDIA: { rotulo: "Média", classe: "border-border bg-muted text-muted-foreground", peso: 2 },
  BAIXA: { rotulo: "Baixa", classe: "border-border bg-transparent text-muted-foreground", peso: 3 },
};

export const STATUS_OS = ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"] as const;
export type StatusOS = (typeof STATUS_OS)[number];

export const SITUACAO_OS: Record<StatusOS, { rotulo: string; classe: string }> = {
  ABERTA: { rotulo: "Aberta", classe: "border-manutencao/45 bg-manutencao/10 text-manutencao" },
  EM_ANDAMENTO: { rotulo: "Em andamento", classe: "border-primary/40 bg-primary/10 text-primary" },
  CONCLUIDA: { rotulo: "Concluída", classe: "border-livre/45 bg-livre/10 text-livre" },
  CANCELADA: { rotulo: "Cancelada", classe: "border-border bg-muted text-muted-foreground line-through" },
};

/** Ainda pede trabalho (aparece em "Para resolver" e no selo 🔧 do mapa). */
export const emAberto = (status: StatusOS) => status === "ABERTA" || status === "EM_ANDAMENTO";

/** Sugestões para o campo de especialidade do prestador (dá para digitar outra). */
export const ESPECIALIDADES = [
  "Encanador",
  "Eletricista",
  "Pintor",
  "Pedreiro",
  "Marceneiro",
  "Chaveiro",
  "Vidraceiro",
  "Técnico de ar-condicionado",
  "Limpeza",
  "Jardinagem",
] as const;

/** 7 → "OS 0007". */
export const numeroOS = (numero: number) => `OS ${String(numero).padStart(4, "0")}`;

/**
 * Ao abrir a OS, oferecer "colocar o imóvel em Manutenção"? Só faz sentido com ele vazio (Livre ou
 * Reservado): com inquilino morando o status continua Ocupado (e o mapa ganha o selo 🔧); em Reforma
 * ou Manutenção, já está fora do aluguel.
 */
export const ofereceManutencao = (statusApto: string) => statusApto === "LIVRE" || statusApto === "RESERVADO";

/**
 * Ao concluir ou cancelar: oferecer devolver o imóvel ao status de antes? Só se foi esta OS que o colocou
 * em Manutenção e ele ainda está assim. Com outra OS aberta no mesmo imóvel, a sugestão é deixar como está.
 */
export function ofereceVoltarStatus(os: { statusAnteriorApto: string | null }, statusAtualApto: string | null, outrasAbertas: number) {
  if (!os.statusAnteriorApto || statusAtualApto !== "MANUTENCAO") return null;
  return { para: os.statusAnteriorApto, sugerido: outrasAbertas === 0 };
}

/** Ordem de "Para resolver": urgência primeiro; na mesma prioridade, a mais antiga primeiro. */
export function ordenarParaResolver<T extends { prioridade: PrioridadeOS; abertaEm: string; numero: number }>(a: T, b: T) {
  return PRIORIDADE[a.prioridade].peso - PRIORIDADE[b.prioridade].peso || a.abertaEm.localeCompare(b.abertaEm) || a.numero - b.numero;
}

/** "aberta hoje" / "aberta há 1 dia" / "aberta há 12 dias". */
export function abertaHa(abertaEm: string, hoje: string) {
  const dias = Math.max(0, diasEntre(abertaEm, hoje));
  return dias === 0 ? "aberta hoje" : `aberta há ${dias} ${dias === 1 ? "dia" : "dias"}`;
}
