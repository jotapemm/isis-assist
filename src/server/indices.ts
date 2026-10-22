import "server-only";
import { isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import { somarMeses, ultimoDiaDoMes } from "@/lib/datas";
import { mesesDoPeriodo, SERIE_BCB } from "@/modulos/contratos/reajuste";
import { db } from "./db";

type IndiceOficial = keyof typeof SERIE_BCB;

const dataBR = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/**
 * Busca as variações mensais na API pública do Banco Central (SGS) e guarda no banco.
 * Duas tentativas, 8 s cada: a API às vezes responde vazio na primeira chamada.
 */
async function buscarNoBancoCentral(indice: IndiceOficial, deMes: string, ateMes: string) {
  const [ano, mes] = ateMes.split("-").map(Number);
  const ate = `${ateMes.slice(0, 8)}${String(ultimoDiaDoMes(ano, mes)).padStart(2, "0")}`;
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${SERIE_BCB[indice]}/dados?formato=json&dataInicial=${dataBR(deMes)}&dataFinal=${dataBR(ate)}`;

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const resposta = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!resposta.ok) continue;
      const dados: unknown = await resposta.json();
      if (!Array.isArray(dados) || dados.length === 0) continue;

      const linhas = dados
        .filter((d): d is { data: string; valor: string } => typeof d?.data === "string" && typeof d?.valor === "string")
        .map((d) => {
          const [dia, mesTexto, anoTexto] = d.data.split("/");
          return { competencia: `${anoTexto}-${mesTexto}-${dia}`, variacao: Number(d.valor) };
        })
        .filter((d) => Number.isFinite(d.variacao));

      await db.indiceEconomico.createMany({
        data: linhas.map((l) => ({ indice, competencia: paraDataCalendario(l.competencia), variacao: l.variacao })),
        skipDuplicates: true,
      });
      return true;
    } catch {
      // Sem internet ou API fora do ar: tenta mais uma vez e depois desiste.
    }
  }
  return false;
}

export type VariacoesDoPeriodo = {
  meses: { competencia: string; variacao: number }[];
  /** Meses que ainda não saíram (ex.: IPCA do mês passado antes do dia 10). */
  faltando: string[];
  /** A busca no Banco Central falhou (sem internet ou API fora do ar). */
  semConexao: boolean;
};

/** As 12 variações mensais de um período, do banco; o que faltar é buscado no Banco Central. */
export async function variacoesDoPeriodo(indice: IndiceOficial, inicio: string): Promise<VariacoesDoPeriodo> {
  const meses = mesesDoPeriodo(inicio);
  const ler = async () =>
    new Map(
      (
        await db.indiceEconomico.findMany({
          where: { indice, competencia: { in: meses.map(paraDataCalendario) } },
          select: { competencia: true, variacao: true },
        })
      ).map((r) => [isoDeDataCalendario(r.competencia), Number(r.variacao)]),
    );

  let salvos = await ler();
  let semConexao = false;
  if (salvos.size < meses.length) {
    semConexao = !(await buscarNoBancoCentral(indice, meses[0], meses[meses.length - 1]));
    salvos = await ler();
  }

  return {
    meses: meses.filter((m) => salvos.has(m)).map((m) => ({ competencia: m, variacao: salvos.get(m)! })),
    faltando: meses.filter((m) => !salvos.has(m)),
    semConexao,
  };
}

/** Atualiza os últimos 24 meses de IGP-M e IPCA (usado pela rotina diária, na Fase 3). */
export async function atualizarIndices(hoje: string) {
  const ate = somarMeses(`${hoje.slice(0, 7)}-01`, -1);
  const de = somarMeses(ate, -23);
  await Promise.all([buscarNoBancoCentral("IGPM", de, ate), buscarNoBancoCentral("IPCA", de, ate)]);
}
