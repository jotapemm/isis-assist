// Contas com datas de calendário, sempre como texto "AAAA-MM-DD" (sem fuso — ver formatar.ts).

const partes = (iso: string) => iso.split("-").map(Number) as [number, number, number];
const doisDigitos = (n: number) => String(n).padStart(2, "0");
const montar = (ano: number, mes: number, dia: number) => `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`;

export function ultimoDiaDoMes(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate();
}

/** Soma meses mantendo o dia; se o mês de destino for mais curto, cai no último dia (31/01 + 1 mês = 28/02). */
export function somarMeses(iso: string, meses: number) {
  const [ano, mes, dia] = partes(iso);
  const total = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return montar(novoAno, novoMes, Math.min(dia, ultimoDiaDoMes(novoAno, novoMes)));
}

export function somarDias(iso: string, dias: number) {
  const [ano, mes, dia] = partes(iso);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

/** Dias de `de` até `ate` (positivo se `ate` vem depois). */
export function diasEntre(de: string, ate: string) {
  const [a1, m1, d1] = partes(de);
  const [a2, m2, d2] = partes(ate);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000);
}

/** Contrato de 12 meses a partir de 10/03/2026 vai até 09/03/2027. */
export function fimDoContrato(inicio: string, meses: number) {
  return somarDias(somarMeses(inicio, meses), -1);
}

/** Meses inteiros entre duas datas (30 para um contrato de 10/03/2026 a 09/09/2028). */
export function mesesEntre(inicio: string, fim: string) {
  const [a1, m1, d1] = partes(inicio);
  const [a2, m2, d2] = partes(somarDias(fim, 1));
  return (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}

/** Próximo aniversário (múltiplo de 12 meses do início) que ainda não passou. */
export function proximoAniversario(inicio: string, hoje: string) {
  let meses = 12;
  while (somarMeses(inicio, meses) <= hoje) meses += 12;
  return somarMeses(inicio, meses);
}

/** "AAAA-MM-01" do mês de uma data. */
export function inicioDoMes(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

/** "daqui a 12 dias", "hoje", "há 3 dias" — para alertas. */
export function distanciaEmDias(hoje: string, alvo: string) {
  const dias = diasEntre(hoje, alvo);
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  return dias > 0 ? `em ${dias} dias` : `há ${-dias} dias`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "2026-09-01" → "set/2026". */
export function mesAbreviado(iso: string) {
  const [ano, mes] = partes(iso);
  return `${MESES[mes - 1]}/${ano}`;
}
