import { describe, expect, it } from "vitest";
import {
  diasEntre,
  distanciaEmDias,
  fimDoContrato,
  mesesEntre,
  proximoAniversario,
  somarDias,
  somarMeses,
} from "../../lib/datas";
import { acumular, aplicarPercentual, mesesDoPeriodo, percentualTexto, periodoDoIndice } from "./reajuste";

describe("datas do contrato", () => {
  it("soma meses sem pular para o mês seguinte", () => {
    expect(somarMeses("2026-01-31", 1)).toBe("2026-02-28");
    expect(somarMeses("2028-01-31", 1)).toBe("2028-02-29"); // bissexto
    expect(somarMeses("2026-11-15", 3)).toBe("2027-02-15");
    expect(somarMeses("2026-03-10", -12)).toBe("2025-03-10");
  });

  it("contrato de 12 meses termina na véspera do aniversário", () => {
    expect(fimDoContrato("2026-03-10", 12)).toBe("2027-03-09");
    expect(fimDoContrato("2026-01-01", 30)).toBe("2028-06-30");
    expect(mesesEntre("2026-03-10", "2027-03-09")).toBe(12);
    expect(mesesEntre("2026-01-01", "2028-06-30")).toBe(30);
  });

  it("acha o próximo aniversário do contrato", () => {
    expect(proximoAniversario("2025-03-10", "2026-10-22")).toBe("2027-03-10");
    expect(proximoAniversario("2026-10-22", "2026-10-22")).toBe("2027-10-22");
    expect(proximoAniversario("2024-10-22", "2026-10-22")).toBe("2027-10-22");
  });

  it("conta dias e descreve a distância", () => {
    expect(diasEntre("2026-10-22", "2026-11-21")).toBe(30);
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
    expect(somarDias("2026-02-28", 1)).toBe("2026-03-01");
    expect(distanciaEmDias("2026-10-22", "2026-10-22")).toBe("hoje");
    expect(distanciaEmDias("2026-10-22", "2026-11-03")).toBe("em 12 dias");
    expect(distanciaEmDias("2026-10-22", "2026-10-19")).toBe("há 3 dias");
  });
});

describe("reajuste", () => {
  it("usa os 12 meses completos antes do aniversário", () => {
    const p = periodoDoIndice("2026-10-15");
    expect(p).toEqual({ inicio: "2025-10-01", fim: "2026-09-01", texto: "out/2025 a set/2026" });
    expect(mesesDoPeriodo(p.inicio)).toHaveLength(12);
    expect(mesesDoPeriodo(p.inicio).at(-1)).toBe("2026-09-01");
    expect(periodoDoIndice("2027-01-05").texto).toBe("jan/2026 a dez/2026");
  });

  it("compõe as variações mês a mês (não soma)", () => {
    expect(acumular([1, 1])).toBeCloseTo(2.01, 10);
    // 1,005 × 0,997 × 1,002 = 1,00398897
    expect(acumular([0.5, -0.3, 0.2])).toBeCloseTo(0.398897, 5);
    expect(acumular([])).toBe(0);
  });

  it("aplica o percentual ao centavo", () => {
    expect(aplicarPercentual(150000, 4.5)).toBe(156750);
    expect(aplicarPercentual(145000, 3.8742)).toBe(150618);
    expect(aplicarPercentual(145000, -1.2)).toBe(143260);
    expect(percentualTexto(4.27314)).toBe("4,27%");
  });
});
