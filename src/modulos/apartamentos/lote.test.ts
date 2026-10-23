import { describe, expect, it } from "vitest";
import { MB, problemaNoArquivo } from "../arquivos/regras";
import { linkTelefone, linkWhatsApp } from "../../lib/whatsapp";
import { gerarIdentificacoes, numerarCasas } from "./lote";
import { vocabulario } from "./vocabulario";
import { compararIdentificacao, nomeAndar } from "./status";

describe("geração em lote", () => {
  it("numera andar + dois dígitos", () => {
    const aptos = gerarIdentificacoes({ andares: 3, porAndar: 4, comTerreo: false });
    expect(aptos).toHaveLength(12);
    expect(aptos.map((a) => a.identificacao)).toEqual([
      "101", "102", "103", "104",
      "201", "202", "203", "204",
      "301", "302", "303", "304",
    ]);
    expect(aptos.at(-1)).toEqual({ identificacao: "304", andar: 3 });
  });

  it("térreo entra a mais, numerado 01, 02…", () => {
    const aptos = gerarIdentificacoes({ andares: 2, porAndar: 2, comTerreo: true });
    expect(aptos.map((a) => a.identificacao)).toEqual(["01", "02", "101", "102", "201", "202"]);
    expect(aptos[0].andar).toBe(0);
  });

  it("mais de 9 por andar continua ordenando certo", () => {
    const ids = gerarIdentificacoes({ andares: 1, porAndar: 12, comTerreo: false }).map((a) => a.identificacao);
    expect(ids.at(-1)).toBe("112");
    expect([...ids].reverse().sort(compararIdentificacao)).toEqual(ids);
  });
});

describe("andares e ordenação", () => {
  it("nomeia o andar", () => {
    expect(nomeAndar(0)).toBe("Térreo");
    expect(nomeAndar(3)).toBe("3º andar");
    expect(nomeAndar(null)).toBe("Sem andar");
  });

  it("ordena números como gente", () => {
    expect(["110", "102", "1001", "101"].sort(compararIdentificacao)).toEqual(["101", "102", "110", "1001"]);
  });
});

describe("WhatsApp e telefone", () => {
  it("monta o link com DDI 55 e mensagem", () => {
    expect(linkWhatsApp("(19) 98765-4321")).toBe("https://wa.me/5519987654321");
    expect(linkWhatsApp("19987654321", "Olá, Ana!")).toBe("https://wa.me/5519987654321?text=Ol%C3%A1%2C%20Ana!");
    expect(linkWhatsApp("5519987654321")).toBe("https://wa.me/5519987654321");
  });

  it("recusa número incompleto", () => {
    expect(linkWhatsApp("98765-4321")).toBeNull();
    expect(linkTelefone("1234")).toBeNull();
    expect(linkTelefone("(19) 98765-4321")).toBe("tel:+5519987654321");
  });
});

describe("regras de arquivo", () => {
  it("foto de apto só aceita imagem e respeita o tamanho", () => {
    expect(problemaNoArquivo("FOTO_APTO", "image/jpeg", 2 * MB)).toBeNull();
    expect(problemaNoArquivo("FOTO_APTO", "application/pdf", 1 * MB)).toMatch(/não é uma foto/);
    expect(problemaNoArquivo("FOTO_APTO", "image/png", 9 * MB)).toMatch(/limite é 8 MB/);
  });

  it("documento aceita PDF", () => {
    expect(problemaNoArquivo("DOCUMENTO", "application/pdf", 3 * MB)).toBeNull();
    expect(problemaNoArquivo("DOCUMENTO", "application/zip", 1 * MB)).toMatch(/PDF ou uma foto/);
  });
});

describe("residencial de casas", () => {
  it("numera em sequência com dois dígitos", () => {
    expect(numerarCasas(3).map((c) => c.identificacao)).toEqual(["01", "02", "03"]);
    expect(numerarCasas(12).at(-1)).toEqual({ identificacao: "12", andar: null });
    expect(numerarCasas(120)[0].identificacao).toBe("001");
  });

  it("concorda o vocabulário em gênero", () => {
    const casa = vocabulario("CASAS");
    const apto = vocabulario("EDIFICIO");
    expect(`${casa.nenhum} ${casa.singular} ${casa.cadastrado}`).toBe("Nenhuma casa cadastrada");
    expect(`${apto.nenhum} ${apto.singular} ${apto.cadastrado}`).toBe("Nenhum apartamento cadastrado");
    expect(`Alugar ${casa.este} ${casa.singular}`).toBe("Alugar esta casa");
    expect(casa.nome("01")).toBe("Casa 01");
    expect(`Quem vai morar ${apto.no} ${apto.nomeMinusculo("203")}?`).toBe("Quem vai morar no apto 203?");
    expect(`Quem vai morar ${casa.no} ${casa.nomeMinusculo("03")}?`).toBe("Quem vai morar na casa 03?");
  });
});
