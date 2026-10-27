import { describe, expect, it } from "vitest";
import { type DespesaRel, dozeMesesAte, informeIR, type PagamentoRel, resultadoPorImovel, resumoDoPeriodo, serieMensal } from "./regras";

const pagamento = (p: Partial<PagamentoRel>): PagamentoRel => ({
  data: "2026-03-05",
  valorPago: 150000,
  valorPrincipal: 150000,
  multa: 0,
  juros: 0,
  forma: "PIX",
  numeroRecibo: 1,
  competencia: "2026-03-01",
  imovel: "101",
  inquilino: { nome: "Ana", cpf: "11144477735" },
  ...p,
});
const despesa = (d: Partial<DespesaRel>): DespesaRel => ({ data: "2026-03-10", categoria: "MANUTENCAO", descricao: "x", valor: 10000, imovel: null, ...d });

describe("resumo e série", () => {
  it("separa aluguel, encargos e despesas", () => {
    const r = resumoDoPeriodo([pagamento({ valorPago: 166000, multa: 15000, juros: 1000 })], [despesa({ valor: 30000 })]);
    expect(r).toEqual({ receitas: 166000, aluguel: 150000, encargos: 16000, despesas: 30000, saldo: 136000 });
  });

  it("conta a receita no mês em que o dinheiro entrou (regime de caixa)", () => {
    // Aluguel de setembro pago em outubro conta em outubro.
    const p = pagamento({ data: "2026-10-22", competencia: "2026-09-01" });
    const serie = serieMensal([p], [], ["2026-09", "2026-10"]);
    expect(serie.map((m) => m.receitas)).toEqual([0, 150000]);
  });

  it("os 12 meses terminam no mês pedido", () => {
    expect(dozeMesesAte("2026-10-27")).toEqual([
      "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04",
      "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10",
    ]);
  });

  it("resultado por imóvel deixa as despesas gerais à parte", () => {
    const r = resultadoPorImovel(
      [pagamento({ imovel: "102" }), pagamento({ imovel: "101" })],
      [despesa({ imovel: "101", valor: 5000 }), despesa({ imovel: null, valor: 7000 })],
      (a, b) => a.localeCompare(b),
    );
    expect(r.imoveis.map((i) => [i.imovel, i.resultado])).toEqual([
      ["101", 145000],
      ["102", 150000],
    ]);
    expect(r.gerais).toBe(7000);
  });
});

describe("informe de IR", () => {
  const informe = informeIR(
    [
      pagamento({ data: "2026-01-05" }),
      pagamento({ data: "2026-02-07", valorPago: 166000, multa: 15000, juros: 1000 }),
      pagamento({ data: "2026-02-10", inquilino: { nome: "Bruno", cpf: null } }),
      pagamento({ data: "2025-12-05" }), // ano anterior: fica fora
    ],
    [despesa({ categoria: "IPTU", data: "2026-02-10", valor: 31000 }), despesa({ categoria: "MANUTENCAO", data: "2026-02-11" })],
    2026,
  );

  it("soma por inquilino e por mês de pagamento", () => {
    const ana = informe.inquilinos.find((p) => p.nome === "Ana")!;
    expect(ana.meses.slice(0, 3)).toEqual([150000, 166000, 0]);
    expect(ana.total).toBe(316000);
    expect(ana.encargos).toBe(16000);
    expect(informe.totalRecebido).toBe(466000);
  });

  it("só IPTU e condomínio entram como dedutíveis", () => {
    expect(informe.dedutiveisPorMes[1]).toBe(31000);
    expect(informe.totalDedutivel).toBe(31000);
  });

  it("avisa quem está sem CPF", () => {
    expect(informe.semCpf).toEqual(["Bruno"]);
  });
});
