// Regras dos lembretes — puras (sem banco), para testar e para o navegador mostrar na hora.
import { diasEntre, somarDias, somarMeses, ultimoDiaDoMes } from "@/lib/datas";

export const RECORRENCIAS = ["NENHUMA", "SEMANAL", "MENSAL", "ANUAL"] as const;
export type Recorrencia = (typeof RECORRENCIAS)[number];

export const RECORRENCIA: Record<Recorrencia, { rotulo: string; curto: string }> = {
  NENHUMA: { rotulo: "Não repete", curto: "" },
  SEMANAL: { rotulo: "Toda semana", curto: "semanal" },
  MENSAL: { rotulo: "Todo mês", curto: "mensal" },
  ANUAL: { rotulo: "Todo ano", curto: "anual" },
};

/**
 * Próxima data de um lembrete que repete. No mensal e no anual vale o dia pedido (`dia`): o "todo dia 31"
 * cai em 28/02 e volta a 31/03 — somar um mês a partir de 28/02 escorregaria para o dia 28 para sempre.
 */
export function proximaData(data: string, recorrencia: Recorrencia, dia?: number | null) {
  if (recorrencia === "NENHUMA") return null;
  if (recorrencia === "SEMANAL") return somarDias(data, 7);
  const base = somarMeses(data, recorrencia === "MENSAL" ? 1 : 12);
  if (!dia) return base;
  const [ano, mes] = base.split("-").map(Number);
  return `${base.slice(0, 8)}${String(Math.min(dia, ultimoDiaDoMes(ano, mes))).padStart(2, "0")}`;
}

export type Grupo = "ATRASADO" | "HOJE" | "SEMANA" | "DEPOIS" | "ANOTACAO" | "CONCLUIDO";

export const GRUPOS: { grupo: Grupo; titulo: string }[] = [
  { grupo: "ATRASADO", titulo: "Atrasados" },
  { grupo: "HOJE", titulo: "Hoje" },
  { grupo: "SEMANA", titulo: "Próximos 7 dias" },
  { grupo: "DEPOIS", titulo: "Mais para frente" },
  { grupo: "ANOTACAO", titulo: "Anotações" },
  { grupo: "CONCLUIDO", titulo: "Concluídos" },
];

/** Em que parte da lista o lembrete aparece. */
export function grupoDoLembrete(l: { data: string | null; concluidoEm: string | null }, hoje: string): Grupo {
  if (l.concluidoEm) return "CONCLUIDO";
  if (!l.data) return "ANOTACAO";
  const dias = diasEntre(hoje, l.data);
  if (dias < 0) return "ATRASADO";
  if (dias === 0) return "HOJE";
  if (dias <= 7) return "SEMANA";
  return "DEPOIS";
}

/**
 * Palavras que pedem conserto (docs/PLANO.md, regra 7): o lembrete sugere abrir uma ordem de serviço.
 * Sem acento e em minúsculas; a comparação também tira os acentos do texto.
 */
const PALAVRAS_DE_CONSERTO = [
  "encanador",
  "vazament",
  "vazando",
  "infiltra",
  "goteira",
  "entupi",
  "eletricista",
  "tomada",
  "disjuntor",
  "chuveiro",
  "pintura",
  "pintar",
  "conserto",
  "consertar",
  "quebrad",
  "quebrou",
  "estragad",
  "rachadura",
  "mofo",
];

const semAcento = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** O lembrete fala de algo que precisa de conserto? Então sugere abrir uma ordem de serviço. */
export const sugereManutencao = (texto: string) => {
  const t = semAcento(texto);
  return PALAVRAS_DE_CONSERTO.some((p) => t.includes(p));
};

/**
 * Datas em que um lembrete aparece num mês do calendário. O banco guarda só a próxima ocorrência; aqui
 * as seguintes são projetadas (toda semana, todo mês…), sem criar nada.
 */
export function ocorrenciasNoMes(
  l: { data: string | null; recorrencia: Recorrencia; diaRecorrencia: number | null; concluidoEm: string | null },
  inicio: string,
  fim: string,
) {
  if (!l.data || l.concluidoEm) return [];
  const datas: string[] = [];
  let atual: string | null = l.data;
  for (let i = 0; atual && atual <= fim && i < 60; i++) {
    if (atual >= inicio) datas.push(atual);
    atual = proximaData(atual, l.recorrencia, l.diaRecorrencia);
  }
  return datas;
}

/** Semanas do calendário (domingo a sábado), com os dias de fora do mês como null. */
export function semanasDoMes(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  const primeiroDiaDaSemana = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const dias: (string | null)[] = Array.from({ length: primeiroDiaDaSemana }, () => null);
  for (let d = 1; d <= ultimoDiaDoMes(ano, mes); d++) dias.push(`${competencia.slice(0, 8)}${String(d).padStart(2, "0")}`);
  while (dias.length % 7) dias.push(null);
  return Array.from({ length: dias.length / 7 }, (_, i) => dias.slice(i * 7, i * 7 + 7));
}

const DIAS_DA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** "Hoje 14:00", "Amanhã", "Ontem", "seg, 02/11", "qui, 05/03/2027". */
export function quandoE(data: string, hora: string | null, hoje: string) {
  const dias = diasEntre(hoje, data);
  const [ano, mes, dia] = data.split("-").map(Number);
  const rotulo =
    dias === 0
      ? "Hoje"
      : dias === 1
        ? "Amanhã"
        : dias === -1
          ? "Ontem"
          : `${DIAS_DA_SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()]}, ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}${ano !== Number(hoje.slice(0, 4)) ? `/${ano}` : ""}`;
  return hora ? `${rotulo} ${hora}` : rotulo;
}
