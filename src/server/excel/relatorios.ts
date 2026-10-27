import "server-only";
import ExcelJS from "exceljs";
import { mascararCpfCnpj } from "@/lib/mascaras";
import { formatarData } from "@/lib/formatar";
import { CATEGORIAS_DESPESA, FORMAS, type FormaPagamento, mesPorExtenso } from "@/modulos/financeiro/regras";
import type { Cabecalho, InformeDeIR, RelatorioDoAno, RelatorioDoMes } from "@/modulos/relatorios/consultas";

// Planilhas dos relatórios. Valores como número (formato R$) e datas como data de verdade: o contador
// soma, filtra e cruza sem redigitar nada.
const MOEDA = '"R$" #,##0.00';
const DATA = "dd/mm/yyyy";
const reais = (centavos: number) => centavos / 100;
const data = (iso: string) => new Date(`${iso}T00:00:00Z`);
const mesDe = (aaaaMm: string) => mesPorExtenso(`${aaaaMm.slice(0, 7)}-01`);
const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

type Coluna = { titulo: string; largura: number; formato?: string };

function aba(livro: ExcelJS.Workbook, nome: string, colunas: Coluna[], linhas: (string | number | Date | null)[][], total?: (string | number | null)[]) {
  const planilha = livro.addWorksheet(nome, { views: [{ state: "frozen", ySplit: 1 }] });
  planilha.columns = colunas.map((c) => ({ header: c.titulo, width: c.largura, style: c.formato ? { numFmt: c.formato } : {} }));
  const cabecalho = planilha.getRow(1);
  cabecalho.font = { bold: true, color: { argb: "FFFFFFFF" } };
  cabecalho.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2C3FA3" } };
  for (const linha of linhas) planilha.addRow(linha);
  if (total) planilha.addRow(total).font = { bold: true };
  return planilha;
}

/** Primeira aba: quem emitiu, o período e os totais. */
function resumo(livro: ExcelJS.Workbook, cab: Cabecalho, periodo: string, totais: [string, number][]) {
  const planilha = livro.addWorksheet("Resumo");
  planilha.columns = [{ width: 34 }, { width: 22 }];
  const linhas: [string, string | number][] = [
    ["Residencial", cab.residencial],
    ["Locador", [cab.locador.nome, cab.locador.documento && mascararCpfCnpj(cab.locador.documento)].filter(Boolean).join(" · ") || "—"],
    ["Período", periodo],
    ["Emitido em", formatarData(cab.emitidoEm)],
    ["", ""],
    ...totais.map(([rotulo, valor]): [string, number] => [rotulo, reais(valor)]),
  ];
  for (const [rotulo, valor] of linhas) {
    const linha = planilha.addRow([rotulo, valor]);
    linha.getCell(1).font = { bold: true };
    if (typeof valor === "number") linha.getCell(2).numFmt = MOEDA;
  }
  planilha.addRow([]);
  planilha.addRow(["Receitas pelo regime de caixa: valem pela data em que o pagamento foi recebido."]).font = { italic: true, color: { argb: "FF5B6280" } };
}

async function buffer(livro: ExcelJS.Workbook) {
  livro.creator = "Isis-Assist";
  return Buffer.from(await livro.xlsx.writeBuffer());
}

export async function excelDoMes(r: RelatorioDoMes) {
  const livro = new ExcelJS.Workbook();
  resumo(livro, r.cabecalho, mesPorExtenso(r.competencia), [
    ["Receitas", r.resumo.receitas],
    ["  aluguel", r.resumo.aluguel],
    ["  multa e juros", r.resumo.encargos],
    ["Despesas", r.resumo.despesas],
    ["Saldo", r.resumo.saldo],
    ["Aluguéis do mês previstos", r.alugueis.previsto],
    ["Recebido desses aluguéis", r.alugueis.recebido],
    ["Em atraso (todos os meses)", r.alugueis.emAtraso],
  ]);
  aba(
    livro,
    "Receitas",
    [
      { titulo: "Data", largura: 12, formato: DATA },
      { titulo: "Imóvel", largura: 10 },
      { titulo: "Inquilino", largura: 30 },
      { titulo: "CPF", largura: 16 },
      { titulo: "Referente a", largura: 18 },
      { titulo: "Forma", largura: 14 },
      { titulo: "Recibo", largura: 9 },
      { titulo: "Aluguel", largura: 13, formato: MOEDA },
      { titulo: "Multa", largura: 11, formato: MOEDA },
      { titulo: "Juros", largura: 11, formato: MOEDA },
      { titulo: "Total", largura: 13, formato: MOEDA },
    ],
    r.pagamentos.map((p) => [
      data(p.data),
      p.imovel,
      p.inquilino.nome,
      p.inquilino.cpf ? mascararCpfCnpj(p.inquilino.cpf) : "",
      mesDe(p.competencia),
      FORMAS[p.forma as FormaPagamento] ?? p.forma,
      p.numeroRecibo,
      reais(p.valorPrincipal),
      reais(p.multa),
      reais(p.juros),
      reais(p.valorPago),
    ]),
    ["Total", null, null, null, null, null, null, reais(r.resumo.aluguel), null, null, reais(r.resumo.receitas)],
  );
  aba(
    livro,
    "Despesas",
    [
      { titulo: "Data", largura: 12, formato: DATA },
      { titulo: "Categoria", largura: 16 },
      { titulo: "Descrição", largura: 46 },
      { titulo: "Imóvel", largura: 12 },
      { titulo: "Valor", largura: 13, formato: MOEDA },
    ],
    r.despesas.map((d) => [data(d.data), CATEGORIAS_DESPESA[d.categoria], d.descricao, d.imovel ?? "Geral", reais(d.valor)]),
    ["Total", null, null, null, reais(r.resumo.despesas)],
  );
  return buffer(livro);
}

export async function excelDoAno(r: RelatorioDoAno) {
  const livro = new ExcelJS.Workbook();
  resumo(livro, r.cabecalho, String(r.ano), [
    ["Receitas", r.resumo.receitas],
    ["Despesas", r.resumo.despesas],
    ["Saldo", r.resumo.saldo],
  ]);
  aba(
    livro,
    "Mês a mês",
    [
      { titulo: "Mês", largura: 20 },
      { titulo: "Receitas", largura: 14, formato: MOEDA },
      { titulo: "Despesas", largura: 14, formato: MOEDA },
      { titulo: "Saldo", largura: 14, formato: MOEDA },
    ],
    r.meses.map((m) => [mesDe(m.mes), reais(m.receitas), reais(m.despesas), reais(m.saldo)]),
    ["Total", reais(r.resumo.receitas), reais(r.resumo.despesas), reais(r.resumo.saldo)],
  );
  aba(
    livro,
    "Por imóvel",
    [
      { titulo: "Imóvel", largura: 30 },
      { titulo: "Receitas", largura: 14, formato: MOEDA },
      { titulo: "Despesas", largura: 14, formato: MOEDA },
      { titulo: "Resultado", largura: 14, formato: MOEDA },
    ],
    [
      ...r.porImovel.imoveis.map((i) => [i.imovel, reais(i.receitas), reais(i.despesas), reais(i.resultado)]),
      ...(r.porImovel.gerais > 0 ? [["Despesas gerais do residencial", null, reais(r.porImovel.gerais), -reais(r.porImovel.gerais)]] : []),
    ],
  );
  aba(
    livro,
    "Por categoria",
    [
      { titulo: "Categoria", largura: 20 },
      { titulo: "Total", largura: 14, formato: MOEDA },
    ],
    r.porCategoria.map((c) => [CATEGORIAS_DESPESA[c.categoria], reais(c.valor)]),
  );
  return buffer(livro);
}

export async function excelDoIR(r: InformeDeIR) {
  const livro = new ExcelJS.Workbook();
  resumo(livro, r.cabecalho, `Ano-calendário ${r.ano}`, [
    ["Aluguéis recebidos", r.totalRecebido],
    ["Despesas dedutíveis (IPTU e condomínio)", r.totalDedutivel],
    ["Recebido menos dedutível", r.totalRecebido - r.totalDedutivel],
  ]);
  aba(
    livro,
    "Por inquilino e mês",
    [
      { titulo: "Inquilino", largura: 30 },
      { titulo: "CPF", largura: 16 },
      ...MESES_CURTOS.map((m) => ({ titulo: m, largura: 11, formato: MOEDA })),
      { titulo: "Total", largura: 13, formato: MOEDA },
    ],
    r.inquilinos.map((p) => [p.nome, p.cpf ? mascararCpfCnpj(p.cpf) : "sem CPF", ...p.meses.map(reais), reais(p.total)]),
    ["Total", null, ...r.recebidoPorMes.map(reais), reais(r.totalRecebido)],
  );
  aba(
    livro,
    "Mês a mês",
    [
      { titulo: "Mês", largura: 20 },
      { titulo: "Recebido", largura: 14, formato: MOEDA },
      { titulo: "Dedutível", largura: 14, formato: MOEDA },
      { titulo: "Diferença", largura: 14, formato: MOEDA },
    ],
    r.meses.map((mes, i) => [mesDe(mes), reais(r.recebidoPorMes[i]), reais(r.dedutiveisPorMes[i]), reais(r.recebidoPorMes[i] - r.dedutiveisPorMes[i])]),
    ["Total", reais(r.totalRecebido), reais(r.totalDedutivel), reais(r.totalRecebido - r.totalDedutivel)],
  );
  aba(
    livro,
    "Despesas dedutíveis",
    [
      { titulo: "Data", largura: 12, formato: DATA },
      { titulo: "Categoria", largura: 14 },
      { titulo: "Descrição", largura: 46 },
      { titulo: "Valor", largura: 13, formato: MOEDA },
    ],
    r.despesasDedutiveis.map((d) => [data(d.data), CATEGORIAS_DESPESA[d.categoria], d.descricao, reais(d.valor)]),
    ["Total", null, null, reais(r.totalDedutivel)],
  );
  if (r.semCpf.length > 0) {
    livro.getWorksheet("Resumo")!.addRow([`Sem CPF cadastrado: ${r.semCpf.join(", ")}. O carnê-leão pede o CPF de quem pagou.`]).font = {
      bold: true,
      color: { argb: "FFB45309" },
    };
  }
  return buffer(livro);
}
