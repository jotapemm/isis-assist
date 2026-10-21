import { describe, expect, it } from "vitest";
import { cnpjValido, cpfOuCnpjValido, cpfValido } from "./documentos";
import {
  formatarData,
  formatarDataHora,
  formatarMoeda,
  hojeISO,
  isoDeDataBR,
  isoDeDataCalendario,
  paraDataCalendario,
} from "./formatar";
import {
  centavosDeDigitos,
  mascararCEP,
  mascararCPF,
  mascararCpfCnpj,
  mascararTelefone,
} from "./mascaras";

// Intl usa espaço não separável depois do "R$".
const semNbsp = (s: string) => s.replace(/ /g, " ");

describe("dinheiro", () => {
  it("formata centavos em reais", () => {
    expect(semNbsp(formatarMoeda(150000))).toBe("R$ 1.500,00");
    expect(semNbsp(formatarMoeda(5))).toBe("R$ 0,05");
    expect(semNbsp(formatarMoeda(-12345))).toBe("-R$ 123,45");
  });

  it("campo de caixa eletrônico: dígitos entram pela direita", () => {
    expect(centavosDeDigitos("150000")).toBe(150000);
    expect(centavosDeDigitos("R$ 1.500,00")).toBe(150000);
    expect(centavosDeDigitos("0,0")).toBe(0);
    expect(centavosDeDigitos("")).toBe(0);
  });
});

describe("datas", () => {
  it("data de calendário não volta um dia por causa do fuso", () => {
    const vencimento = paraDataCalendario("2026-03-01");
    expect(formatarData(vencimento)).toBe("01/03/2026");
    expect(isoDeDataCalendario(vencimento)).toBe("2026-03-01");
    expect(formatarData("2026-12-31")).toBe("31/12/2026");
  });

  it("hoje é calculado no horário de Brasília", () => {
    // 01:30 UTC do dia 2 ainda é dia 1 em Brasília (UTC-3).
    expect(hojeISO(new Date("2026-01-02T01:30:00Z"))).toBe("2026-01-01");
  });

  it("data e hora em Brasília", () => {
    expect(formatarDataHora(new Date("2026-01-02T01:30:00Z"))).toBe("01/01/2026 às 22:30");
  });

  it("lê dd/mm/aaaa e recusa datas que não existem", () => {
    expect(isoDeDataBR("5/3/2026")).toBe("2026-03-05");
    expect(isoDeDataBR("31/02/2026")).toBeNull();
    expect(isoDeDataBR("2026-03-05")).toBeNull();
  });
});

describe("máscaras", () => {
  it("CPF, CNPJ e CEP progressivos", () => {
    expect(mascararCPF("1234")).toBe("123.4");
    expect(mascararCPF("52998224725")).toBe("529.982.247-25");
    expect(mascararCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(mascararCEP("01310100")).toBe("01310-100");
  });

  it("telefone fixo e celular", () => {
    expect(mascararTelefone("1133334444")).toBe("(11) 3333-4444");
    expect(mascararTelefone("11987654321")).toBe("(11) 98765-4321");
    expect(mascararTelefone("119")).toBe("(11) 9");
  });
});

describe("documentos", () => {
  it("valida CPF", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("529.982.247-24")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
  });

  it("valida CNPJ", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11.222.333/0001-80")).toBe(false);
    expect(cpfOuCnpjValido("11222333000181")).toBe(true);
    expect(cpfOuCnpjValido("123")).toBe(false);
  });
});
