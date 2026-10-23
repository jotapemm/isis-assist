import { describe, expect, it } from "vitest";
import { guardarNomeAte } from "./retencao";

describe("prazo para guardar nome e CPF (LGPD x imposto de renda)", () => {
  it("vai até o fim do 6º ano depois do último pagamento", () => {
    // Pago em 2026 → declarado em 2027 → a Receita confere até 2032.
    expect(guardarNomeAte("2026-10-22")).toBe("2032-12-31");
    expect(guardarNomeAte("2025-01-05")).toBe("2031-12-31");
  });

  it("sem pagamento, não guarda nada", () => {
    expect(guardarNomeAte(null)).toBeNull();
  });
});
