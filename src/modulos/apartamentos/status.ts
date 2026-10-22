import { CalendarClock, DoorOpen, type LucideIcon, PaintRoller, UserRound, Wrench } from "lucide-react";

export const STATUS_APARTAMENTO = ["LIVRE", "OCUPADO", "RESERVADO", "REFORMA", "MANUTENCAO"] as const;
export type StatusApartamento = (typeof STATUS_APARTAMENTO)[number];

type InfoStatus = {
  rotulo: string;
  /** Uma linha explicando quando usar — aparece na hora de trocar o status. */
  explicacao: string;
  icone: LucideIcon;
  /** Classes completas (o Tailwind só gera o que aparece escrito por inteiro). */
  texto: string;
  fundo: string;
  borda: string;
  ponto: string;
};

// Status sempre aparece com cor + ícone + texto: funciona no tema escuro e para quem não distingue cores.
export const STATUS: Record<StatusApartamento, InfoStatus> = {
  LIVRE: {
    rotulo: "Livre",
    explicacao: "Pronto para alugar.",
    icone: DoorOpen,
    texto: "text-livre",
    fundo: "bg-livre/10",
    borda: "border-livre/45",
    ponto: "bg-livre",
  },
  OCUPADO: {
    rotulo: "Ocupado",
    explicacao: "Tem inquilino morando.",
    icone: UserRound,
    texto: "text-ocupado",
    fundo: "bg-ocupado/10",
    borda: "border-ocupado/40",
    ponto: "bg-ocupado",
  },
  RESERVADO: {
    rotulo: "Reservado",
    explicacao: "Combinado com alguém, ainda sem contrato.",
    icone: CalendarClock,
    texto: "text-reservado",
    fundo: "bg-reservado/12",
    borda: "border-reservado/50",
    ponto: "bg-reservado",
  },
  REFORMA: {
    rotulo: "Reforma",
    explicacao: "Em obra ou pintura, fora do aluguel por um tempo.",
    icone: PaintRoller,
    texto: "text-reforma",
    fundo: "bg-reforma/10",
    borda: "border-reforma/45",
    ponto: "bg-reforma",
  },
  MANUTENCAO: {
    rotulo: "Manutenção",
    explicacao: "Vazio e com conserto em andamento.",
    icone: Wrench,
    texto: "text-manutencao",
    fundo: "bg-manutencao/10",
    borda: "border-manutencao/45",
    ponto: "bg-manutencao",
  },
};

/** 0 → "Térreo", 3 → "3º andar", vazio → "Sem andar". */
export function nomeAndar(andar: number | null) {
  if (andar === null) return "Sem andar";
  return andar === 0 ? "Térreo" : `${andar}º andar`;
}

/** Ordena "101, 102, 110" como gente (e não "101, 110, 102"). */
export function compararIdentificacao(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });
}
