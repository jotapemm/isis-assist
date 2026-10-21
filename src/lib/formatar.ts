// Formatação para a tela, sempre no padrão brasileiro: R$ 1.500,00 e dd/mm/aaaa.

export const FUSO = "America/Sao_Paulo";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 150000 → "R$ 1.500,00". Dinheiro trafega sempre em centavos inteiros. */
export function formatarMoeda(centavos: number) {
  return moeda.format(centavos / 100);
}

/** 150000 → "1.500,00" (para campos que já mostram o "R$" ao lado). */
export function formatarValor(centavos: number) {
  return numero2.format(centavos / 100);
}

/** 10 → "10%", 2.5 → "2,5%". */
export function formatarPercentual(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`;
}

// ─── Datas ───
// "Datas de calendário" (vencimento, início de contrato…) ficam no banco como @db.Date e chegam
// aqui como meia-noite UTC. Lê-las com o fuso local mostraria o dia anterior no Brasil, então
// elas são sempre tratadas pelos campos UTC ou como texto "AAAA-MM-DD".

const ISO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Date (meia-noite UTC) ou "AAAA-MM-DD" → "dd/mm/aaaa". */
export function formatarData(data: Date | string) {
  const iso = typeof data === "string" ? data.slice(0, 10) : isoDeDataCalendario(data);
  const [, ano, mes, dia] = ISO_DATA.exec(iso) ?? [];
  return ano ? `${dia}/${mes}/${ano}` : "";
}

/** Momento exato (createdAt, data do pagamento registrada) → "dd/mm/aaaa às hh:mm" no horário de Brasília. */
export function formatarDataHora(momento: Date) {
  const partes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(momento);
  const p = Object.fromEntries(partes.map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} às ${p.hour}:${p.minute}`;
}

/** Hoje em Brasília, como "AAAA-MM-DD" — independe do fuso do servidor. */
export function hojeISO(agora = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(agora);
}

/** "AAAA-MM-DD" → Date meia-noite UTC, o formato que o Prisma grava em @db.Date. */
export function paraDataCalendario(iso: string) {
  const [, ano, mes, dia] = ISO_DATA.exec(iso) ?? [];
  if (!ano) throw new Error(`Data inválida: ${iso}`);
  return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
}

/** Date de @db.Date → "AAAA-MM-DD". */
export function isoDeDataCalendario(data: Date) {
  return data.toISOString().slice(0, 10);
}

/** "dd/mm/aaaa" → "AAAA-MM-DD" (ou null se não for uma data que existe). Usado na importação de planilhas. */
export function isoDeDataBR(texto: string) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
    return null;
  }
  return isoDeDataCalendario(data);
}

/** Saudação pela hora de Brasília. */
export function saudacao(agora = new Date()) {
  const hora = Number(new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", hourCycle: "h23" }).format(agora));
  if (hora < 5) return "Boa noite";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}
