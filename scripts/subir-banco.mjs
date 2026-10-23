// Sobe o Postgres local do Prisma — ou avisa que ele já está no ar.
// (Rodar `prisma dev` com o banco já ligado dá "Port 51215 is not available", que assusta à toa.)
// Uso: npm run db:subir
import "dotenv/config";
import { spawnSync } from "node:child_process";
import { readdirSync, rmdirSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const NOME = "isis-assist";
const url = new URL(process.env.DATABASE_URL ?? "postgres://localhost:51214");
const porta = Number(url.port || 5432);

if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
  console.log(`DATABASE_URL aponta para ${url.hostname}, não para o banco local. Nada a subir.`);
  process.exit(0);
}

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

// Desligar o computador com o banco ligado deixa as travas do `prisma dev` para trás, e na volta ele
// sobe um banco VAZIO em vez de abrir os dados (aconteceu em 23/10/2026). Com a porta fechada, nenhum
// banco nosso está rodando: as travas são velhas e podem sair. Pasta de dados = convenção do env-paths.
const dados = {
  win32: path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "prisma-dev-nodejs", "Data"),
  darwin: path.join(os.homedir(), "Library", "Application Support", "prisma-dev-nodejs"),
}[process.platform] ?? path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"), "prisma-dev-nodejs");
for (const trava of [path.join(dados, NOME, ".lock"), path.join(dados, "durable-streams", NOME, "server.lock.lock")]) {
  try {
    if (readdirSync(trava).length === 0) {
      rmdirSync(trava);
      console.log(`Trava velha do banco removida: ${trava}`);
    }
  } catch {
    // Não existe: tudo certo.
  }
}

const resultado = spawnSync("npx", ["prisma", "dev", "--name", NOME, "--detach"], { stdio: "inherit", shell: true });
process.exit(resultado.status ?? 1);
