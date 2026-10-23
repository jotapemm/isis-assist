import { describe, expect, it } from "vitest";
import { configDoBanco } from "./banco-config";

describe("conexão com o banco", () => {
  it("banco local vai como está", () => {
    expect(configDoBanco("postgres://postgres:postgres@localhost:51214/template1?sslmode=disable")).toEqual({
      connectionString: "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable",
    });
  });

  it("Supabase sem sslmode vai criptografado e com poucas conexões", () => {
    const config = configDoBanco("postgresql://postgres.abc:senha@aws-0-sa-east-1.pooler.supabase.com:5432/postgres");
    expect(config.ssl).toEqual({ rejectUnauthorized: false });
    expect(config.max).toBe(5);
  });

  it("sslmode na URL manda", () => {
    expect(configDoBanco("postgresql://u:s@db.exemplo.com:5432/x?sslmode=verify-full").ssl).toBeUndefined();
  });
});
