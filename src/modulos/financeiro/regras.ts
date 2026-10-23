// Regras do financeiro — puras (sem banco), para testar e para o navegador mostrar as contas na hora.
import { diasEntre, somarDias, ultimoDiaDoMes } from "@/lib/datas";
import { formatarData, formatarMoeda } from "@/lib/formatar";

// ─── Datas ───

/** "2026-10-15" → "2026-10-01" (a competência é o mês). */
export const competenciaDe = (iso: string) => `${iso.slice(0, 7)}-01`;

/** Vencimento do mês: dia 31 em fevereiro cai no último dia. */
export function vencimentoNoMes(competencia: string, dia: number) {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${competencia.slice(0, 8)}${String(Math.min(dia, ultimoDiaDoMes(ano, mes))).padStart(2, "0")}`;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10-01" → "outubro de 2026". */
export function mesPorExtenso(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${MESES[mes - 1]} de ${ano}`;
}

/** "2026-10-01" → "outubro" (sem o ano, para frases curtas). */
export const nomeDoMes = (competencia: string) => MESES[Number(competencia.slice(5, 7)) - 1];

// ─── Situação da cobrança ───

export type Situacao = "A_VENCER" | "VENCE_HOJE" | "VENCIDA" | "ATRASADA" | "PARCIAL" | "PAGA" | "CANCELADA";

/**
 * O status gravado (PENDENTE/PARCIAL/PAGO/CANCELADO) mais o calendário. Entre o vencimento e o fim da
 * tolerância ela "venceu" (sem multa); depois disso está atrasada.
 */
export function situacaoDaCobranca(
  cobranca: { status: "PENDENTE" | "PARCIAL" | "PAGO" | "CANCELADO"; vencimento: string },
  hoje: string,
  diasCarencia: number,
): Situacao {
  if (cobranca.status === "CANCELADO") return "CANCELADA";
  if (cobranca.status === "PAGO") return "PAGA";
  const dias = diasEntre(cobranca.vencimento, hoje);
  if (dias > diasCarencia) return "ATRASADA";
  if (cobranca.status === "PARCIAL") return "PARCIAL";
  if (dias > 0) return "VENCIDA";
  return dias === 0 ? "VENCE_HOJE" : "A_VENCER";
}

export const SITUACAO: Record<Situacao, { rotulo: string; classe: string }> = {
  A_VENCER: { rotulo: "A vencer", classe: "border-border bg-muted text-muted-foreground" },
  VENCE_HOJE: { rotulo: "Vence hoje", classe: "border-reservado/50 bg-reservado/12 text-reservado" },
  VENCIDA: { rotulo: "Venceu", classe: "border-reservado/50 bg-reservado/12 text-reservado" },
  ATRASADA: { rotulo: "Atrasado", classe: "border-destructive/40 bg-destructive/10 text-destructive" },
  PARCIAL: { rotulo: "Pago em parte", classe: "border-reservado/50 bg-reservado/12 text-reservado" },
  PAGA: { rotulo: "Pago", classe: "border-livre/45 bg-livre/10 text-livre" },
  CANCELADA: { rotulo: "Cancelado", classe: "border-border bg-muted text-muted-foreground line-through" },
};

// ─── Multa e juros ───

export type RegrasDeAtraso = { multaPercentual: number; jurosMensalPercentual: number; diasCarencia: number };

/**
 * Encargos de um pagamento atrasado: multa única + juros simples pro rata dia (mês de 30 dias),
 * contados desde o vencimento. Dentro da tolerância não há encargo nenhum.
 */
export function calcularEncargos(saldo: number, vencimento: string, dataPagamento: string, regras: RegrasDeAtraso) {
  const diasAtraso = Math.max(0, diasEntre(vencimento, dataPagamento));
  if (saldo <= 0 || diasAtraso === 0 || diasAtraso <= regras.diasCarencia) return { diasAtraso, multa: 0, juros: 0 };
  return {
    diasAtraso,
    multa: Math.round((saldo * regras.multaPercentual) / 100),
    juros: Math.round(((saldo * regras.jurosMensalPercentual) / 100 / 30) * diasAtraso),
  };
}

/** Último dia sem encargo (vencimento + tolerância). */
export const fimDaTolerancia = (vencimento: string, diasCarencia: number) => somarDias(vencimento, diasCarencia);

// ─── Formas de pagamento e categorias de despesa ───

export const FORMAS = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto",
  CARTAO: "Cartão",
  OUTRA: "Outra",
} as const;
export type FormaPagamento = keyof typeof FORMAS;

export const CATEGORIAS_DESPESA = {
  IPTU: "IPTU",
  CONDOMINIO: "Condomínio",
  AGUA: "Água",
  LUZ: "Luz",
  GAS: "Gás",
  INTERNET: "Internet",
  MANUTENCAO: "Manutenção",
  SEGURO: "Seguro",
  TAXAS: "Taxas",
  OUTROS: "Outros",
} as const;
export type CategoriaDespesa = keyof typeof CATEGORIAS_DESPESA;

// ─── Valor por extenso (recibo) ───

const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number) {
  if (n === 100) return "cem";
  const partes: string[] = [];
  const centena = Math.floor(n / 100);
  const resto = n % 100;
  if (centena) partes.push(CENTENAS[centena]);
  if (resto) {
    const dezena = Math.floor(resto / 10);
    const unidade = resto % 10;
    partes.push(resto < 20 ? UNIDADES[resto] : unidade ? `${DEZENAS[dezena]} e ${UNIDADES[unidade]}` : DEZENAS[dezena]);
  }
  return partes.join(" e ");
}

/** 1450 → "mil quatrocentos e cinquenta"; 1500 → "mil e quinhentos" (regra do "e" do português). */
function inteiroPorExtenso(n: number) {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const grupos: string[] = [];
  if (milhoes) grupos.push(milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`);
  if (milhares) grupos.push(milhares === 1 ? "mil" : `${ate999(milhares)} mil`);
  if (!resto) return grupos.join(" e ");
  // "e" antes do último grupo só se ele for menor que 100 ou centena redonda: "mil e cem", "mil duzentos e trinta".
  const liga = resto < 100 || resto % 100 === 0 ? " e " : " ";
  return grupos.length ? `${grupos.join(" e ")}${liga}${ate999(resto)}` : ate999(resto);
}

/** 145030 → "mil quatrocentos e cinquenta reais e trinta centavos". */
export function porExtenso(centavos: number) {
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  const partes: string[] = [];
  if (reais) {
    const deReais = reais >= 1_000_000 && reais % 1_000_000 === 0 ? " de reais" : reais === 1 ? " real" : " reais";
    partes.push(inteiroPorExtenso(reais) + deReais);
  }
  if (cents) partes.push(`${inteiroPorExtenso(cents)} ${cents === 1 ? "centavo" : "centavos"}`);
  return partes.length ? partes.join(" e ") : "zero reais";
}

// ─── Mensagens prontas para o WhatsApp ───

type DadosMensagem = {
  nomeInquilino: string;
  /** "do apto 203" / "da casa 01" */
  doImovel: string;
  competencia: string;
  vencimento: string;
  valor: number;
  chavePix?: string | null;
};

export function mensagemCobranca(d: DadosMensagem, atrasada: boolean) {
  const primeiro = d.nomeInquilino.split(" ")[0];
  const pix = d.chavePix ? `\n\nChave PIX: ${d.chavePix}` : "";
  return atrasada
    ? `Olá, ${primeiro}! O aluguel de ${nomeDoMes(d.competencia)} ${d.doImovel} (${formatarMoeda(d.valor)}) venceu em ${formatarData(d.vencimento)} e ainda não consta como pago. Consegue verificar?${pix}`
    : `Olá, ${primeiro}! Passando para lembrar do aluguel de ${nomeDoMes(d.competencia)} ${d.doImovel}: ${formatarMoeda(d.valor)}, com vencimento em ${formatarData(d.vencimento)}.${pix}`;
}

export function mensagemRecibo(d: Omit<DadosMensagem, "vencimento" | "chavePix"> & { dataPagamento: string; numeroRecibo: number }) {
  const primeiro = d.nomeInquilino.split(" ")[0];
  return `Olá, ${primeiro}! Confirmo o recebimento de ${formatarMoeda(d.valor)} referente ao aluguel de ${nomeDoMes(d.competencia)} ${d.doImovel}, em ${formatarData(d.dataPagamento)}. Recibo nº ${String(d.numeroRecibo).padStart(4, "0")}. Agradeço!`;
}
