// Sobe o Postgres local do Prisma — ou avisa que ele já está no ar.
// (Rodar `prisma dev` com o banco já ligado dá "Port 51215 is not available", que assusta à toa.)
// Uso: npm run db:subir
import "dotenv/config";
import { spawnSync } from "node:child_process";
import net from "node:net";

const url = new URL(process.env.DATABASE_URL ?? "postgres://localhost:51214");
const porta = Number(url.port || 5432);

const respondendo = await new Promise((ok) => {
  const conexao = net.connect(porta, "127.0.0.1");
  conexao.setTimeout(1500);
  conexao.once("connect", () => (conexao.end(), ok(true)));
  conexao.once("timeout", () => (conexao.destroy(), ok(false)));
  conexao.once("error", () => ok(false));
});

if (respondendo) {
  console.log(`O banco local já está rodando (porta ${porta}). Pode seguir com npm run dev.`);
  process.exit(0);
}

const resultado = spawnSync("npx", ["prisma", "dev", "--name", "isis-assist", "--detach"], { stdio: "inherit", shell: true });
process.exit(resultado.status ?? 1);
