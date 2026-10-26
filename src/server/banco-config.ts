import type { PoolConfig } from "pg";

/**
 * Opções do pool do pg — usadas pelo app (db.ts) e pelo seed.
 *
 * No banco da nuvem (Supabase) a conexão vai criptografada. O certificado do Supabase é assinado
 * pela autoridade própria deles, que o Node não conhece, e o pg trata `sslmode=require` como
 * verificação completa: com ele na URL, a conexão falharia. Por isso a URL vai como o Supabase
 * mostra (sem sslmode) e aqui liga o TLS sem conferir a cadeia. Com sslmode na URL, vale a URL.
 *
 * Poucas conexões por instância, fechadas logo que ficam paradas (5 s): o pooler do Supabase tem teto
 * baixo no plano grátis e derruba conexão ociosa — melhor o pool largar antes (ver db.ts).
 */
export function configDoBanco(url = process.env.DATABASE_URL): PoolConfig {
  if (!url) return { connectionString: url };
  const { hostname, searchParams } = new URL(url);
  // Banco local (`prisma dev`): aguenta umas 8 conexões ao mesmo tempo e derruba a seguinte. O padrão
  // do pg é 10, e telas que disparam muitas consultas juntas (painel, calendário) passavam do limite.
  if (["localhost", "127.0.0.1"].includes(hostname)) return { connectionString: url, max: 5 };
  return {
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    ...(searchParams.has("sslmode") ? {} : { ssl: { rejectUnauthorized: false } }),
  };
}
