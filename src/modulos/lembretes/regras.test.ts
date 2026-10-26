import { describe, expect, it } from "vitest";
import { grupoDoLembrete, ocorrenciasNoMes, proximaData, quandoE, semanasDoMes, sugereManutencao } from "./regras";

describe("recorrência", () => {
  it("soma uma semana, um mês ou um ano", () => {
    expect(proximaData("2026-10-26", "SEMANAL")).toBe("2026-11-02");
    expect(proximaData("2026-10-26", "MENSAL", 26)).toBe("2026-11-26");
    expect(proximaData("2026-10-26", "ANUAL", 26)).toBe("2027-10-26");
    expect(proximaData("2026-10-26", "NENHUMA")).toBeNull();
  });

  it("o todo dia 31 cai no fim de fevereiro e volta ao 31 depois", () => {
    expect(proximaData("2027-01-31", "MENSAL", 31)).toBe("2027-02-28");
    expect(proximaData("2027-02-28", "MENSAL", 31)).toBe("2027-03-31");
    expect(proximaData("2028-02-29", "ANUAL", 29)).toBe("2029-02-28");
    expect(proximaData("2029-02-28", "ANUAL", 29)).toBe("2030-02-28");
  });
});

describe("lista", () => {
  const hoje = "2026-10-26";
  it("separa atrasados, hoje, semana, depois, anotações e concluídos", () => {
    expect(grupoDoLembrete({ data: "2026-10-20", concluidoEm: null }, hoje)).toBe("ATRASADO");
    expect(grupoDoLembrete({ data: hoje, concluidoEm: null }, hoje)).toBe("HOJE");
    expect(grupoDoLembrete({ data: "2026-11-02", concluidoEm: null }, hoje)).toBe("SEMANA");
    expect(grupoDoLembrete({ data: "2026-11-03", concluidoEm: null }, hoje)).toBe("DEPOIS");
    expect(grupoDoLembrete({ data: null, concluidoEm: null }, hoje)).toBe("ANOTACAO");
    expect(grupoDoLembrete({ data: "2026-10-20", concluidoEm: "2026-10-21T12:00:00Z" }, hoje)).toBe("CONCLUIDO");
  });

  it("palavras de conserto sugerem ordem de serviço, com ou sem acento", () => {
    expect(sugereManutencao("Chamar o encanador para o 301")).toBe(true);
    expect(sugereManutencao("Infiltração no teto do 201")).toBe(true);
    expect(sugereManutencao("INFILTRACAO no teto")).toBe(true);
    expect(sugereManutencao("Levar o IPTU para a contadora")).toBe(false);
  });
});

describe("calendário", () => {
  it("projeta as próximas ocorrências dentro do mês", () => {
    const semanal = { data: "2026-10-01", recorrencia: "SEMANAL" as const, diaRecorrencia: null, concluidoEm: null };
    expect(ocorrenciasNoMes(semanal, "2026-11-01", "2026-11-30")).toEqual(["2026-11-05", "2026-11-12", "2026-11-19", "2026-11-26"]);
    const unico = { data: "2026-11-10", recorrencia: "NENHUMA" as const, diaRecorrencia: null, concluidoEm: null };
    expect(ocorrenciasNoMes(unico, "2026-11-01", "2026-11-30")).toEqual(["2026-11-10"]);
    expect(ocorrenciasNoMes({ ...unico, concluidoEm: "2026-11-10T10:00:00Z" }, "2026-11-01", "2026-11-30")).toEqual([]);
  });

  it("monta as semanas de domingo a sábado", () => {
    // Outubro de 2026 começa numa quinta-feira.
    const semanas = semanasDoMes("2026-10-01");
    expect(semanas[0]).toEqual([null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(semanas.at(-1)?.filter(Boolean).at(-1)).toBe("2026-10-31");
    expect(semanas.every((s) => s.length === 7)).toBe(true);
  });
});

describe("como a data aparece", () => {
  it("fala como gente", () => {
    const hoje = "2026-10-26"; // segunda-feira
    expect(quandoE("2026-10-26", "14:00", hoje)).toBe("Hoje 14:00");
    expect(quandoE("2026-10-27", null, hoje)).toBe("Amanhã");
    expect(quandoE("2026-10-25", null, hoje)).toBe("Ontem");
    expect(quandoE("2026-11-02", null, hoje)).toBe("seg, 02/11");
    expect(quandoE("2027-03-05", "09:30", hoje)).toBe("sex, 05/03/2027 09:30");
  });
});
