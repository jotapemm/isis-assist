import { describe, expect, it } from "vitest";
import { abertaHa, numeroOS, ofereceManutencao, ofereceVoltarStatus, ordenarParaResolver } from "./regras";

describe("ordens de serviço", () => {
  it("numera com quatro dígitos", () => {
    expect(numeroOS(7)).toBe("OS 0007");
    expect(numeroOS(1234)).toBe("OS 1234");
  });

  it("só oferece Manutenção para imóvel vazio", () => {
    expect(ofereceManutencao("LIVRE")).toBe(true);
    expect(ofereceManutencao("RESERVADO")).toBe(true);
    expect(ofereceManutencao("OCUPADO")).toBe(false);
    expect(ofereceManutencao("REFORMA")).toBe(false);
    expect(ofereceManutencao("MANUTENCAO")).toBe(false);
  });

  it("devolve o status de antes só se foi a OS que mudou e ele continua em Manutenção", () => {
    expect(ofereceVoltarStatus({ statusAnteriorApto: "LIVRE" }, "MANUTENCAO", 0)).toEqual({ para: "LIVRE", sugerido: true });
    // Outra OS ainda aberta no imóvel: oferece, mas sugere deixar como está.
    expect(ofereceVoltarStatus({ statusAnteriorApto: "LIVRE" }, "MANUTENCAO", 1)).toEqual({ para: "LIVRE", sugerido: false });
    // Alguém já mudou o status (ex.: contrato novo): não mexe.
    expect(ofereceVoltarStatus({ statusAnteriorApto: "LIVRE" }, "OCUPADO", 0)).toBeNull();
    // A OS não tinha mudado o status.
    expect(ofereceVoltarStatus({ statusAnteriorApto: null }, "MANUTENCAO", 0)).toBeNull();
  });

  it("põe urgente primeiro e, na mesma prioridade, a mais antiga", () => {
    const os = [
      { numero: 3, prioridade: "MEDIA" as const, abertaEm: "2026-10-01" },
      { numero: 5, prioridade: "URGENTE" as const, abertaEm: "2026-10-20" },
      { numero: 1, prioridade: "MEDIA" as const, abertaEm: "2026-09-15" },
    ];
    expect(os.sort(ordenarParaResolver).map((o) => o.numero)).toEqual([5, 1, 3]);
  });

  it("diz há quanto tempo está aberta", () => {
    expect(abertaHa("2026-10-23", "2026-10-23")).toBe("aberta hoje");
    expect(abertaHa("2026-10-22", "2026-10-23")).toBe("aberta há 1 dia");
    expect(abertaHa("2026-10-11", "2026-10-23")).toBe("aberta há 12 dias");
  });
});
