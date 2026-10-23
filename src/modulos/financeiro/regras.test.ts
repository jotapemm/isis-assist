import { describe, expect, it } from "vitest";
import {
  calcularEncargos,
  competenciaDe,
  mensagemCobranca,
  mesPorExtenso,
  porExtenso,
  situacaoDaCobranca,
  vencimentoNoMes,
} from "./regras";

const regras = { multaPercentual: 10, jurosMensalPercentual: 1, diasCarencia: 3 };

describe("vencimento", () => {
  it("cai no dia do contrato, ou no último dia de meses curtos", () => {
    expect(vencimentoNoMes("2026-10-01", 10)).toBe("2026-10-10");
    expect(vencimentoNoMes("2026-02-01", 31)).toBe("2026-02-28");
    expect(vencimentoNoMes("2028-02-01", 30)).toBe("2028-02-29");
    expect(competenciaDe("2026-10-22")).toBe("2026-10-01");
    expect(mesPorExtenso("2026-10-01")).toBe("outubro de 2026");
  });
});

describe("situação da cobrança", () => {
  const pendente = (vencimento: string) => ({ status: "PENDENTE" as const, vencimento });
  it("usa a tolerância antes de chamar de atrasada", () => {
    expect(situacaoDaCobranca(pendente("2026-10-25"), "2026-10-22", 3)).toBe("A_VENCER");
    expect(situacaoDaCobranca(pendente("2026-10-22"), "2026-10-22", 3)).toBe("VENCE_HOJE");
    expect(situacaoDaCobranca(pendente("2026-10-20"), "2026-10-22", 3)).toBe("VENCIDA");
    expect(situacaoDaCobranca(pendente("2026-10-18"), "2026-10-22", 3)).toBe("ATRASADA");
    expect(situacaoDaCobranca({ status: "PARCIAL", vencimento: "2026-10-30" }, "2026-10-22", 3)).toBe("PARCIAL");
    expect(situacaoDaCobranca({ status: "PARCIAL", vencimento: "2026-10-01" }, "2026-10-22", 3)).toBe("ATRASADA");
    expect(situacaoDaCobranca({ status: "PAGO", vencimento: "2026-01-01" }, "2026-10-22", 3)).toBe("PAGA");
  });
});

describe("multa e juros", () => {
  it("sem encargo até o fim da tolerância", () => {
    expect(calcularEncargos(150000, "2026-10-10", "2026-10-13", regras)).toEqual({ diasAtraso: 3, multa: 0, juros: 0 });
    expect(calcularEncargos(150000, "2026-10-10", "2026-10-05", regras)).toEqual({ diasAtraso: 0, multa: 0, juros: 0 });
  });

  it("multa única + juros pro rata dia desde o vencimento", () => {
    // 10 dias de atraso: multa 10% = 150,00; juros 1% ao mês × 10/30 = 5,00
    expect(calcularEncargos(150000, "2026-10-10", "2026-10-20", regras)).toEqual({ diasAtraso: 10, multa: 15000, juros: 500 });
    // 45 dias: juros 1,5% = 22,50
    expect(calcularEncargos(150000, "2026-09-05", "2026-10-20", regras).juros).toBe(2250);
  });
});

describe("valor por extenso", () => {
  it("escreve como no recibo de papel", () => {
    expect(porExtenso(145000)).toBe("mil quatrocentos e cinquenta reais");
    expect(porExtenso(150000)).toBe("mil e quinhentos reais");
    expect(porExtenso(210050)).toBe("dois mil e cem reais e cinquenta centavos");
    expect(porExtenso(123456)).toBe("mil duzentos e trinta e quatro reais e cinquenta e seis centavos");
    expect(porExtenso(100)).toBe("um real");
    expect(porExtenso(1)).toBe("um centavo");
    expect(porExtenso(10000)).toBe("cem reais");
    expect(porExtenso(16500)).toBe("cento e sessenta e cinco reais");
    expect(porExtenso(100000000)).toBe("um milhão de reais");
    expect(porExtenso(1500000)).toBe("quinze mil reais");
  });
});

describe("mensagem de cobrança", () => {
  it("monta o lembrete com a chave PIX", () => {
    const texto = mensagemCobranca(
      { nomeInquilino: "Ana Paula Ferreira", doImovel: "do apto 101", competencia: "2026-10-01", vencimento: "2026-10-05", valor: 140292, chavePix: "maria@exemplo.com" },
      false,
    );
    expect(texto).toContain("Olá, Ana!");
    expect(texto).toContain("aluguel de outubro do apto 101");
    expect(texto).toContain("vencimento em 05/10/2026");
    expect(texto).toContain("Chave PIX: maria@exemplo.com");
  });
});
