import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { configDoBanco } from "./banco-config";

// Em dev o Next recarrega os módulos a cada edição; guardar o cliente no globalThis
// evita abrir um pool de conexões novo a cada recarga.
const globalComPrisma = globalThis as unknown as { prisma?: PrismaClient };

function criarCliente() {
  const pool = new Pool(configDoBanco());
  // Na Vercel a função congela entre um acesso e outro; enquanto isso o Supabase derruba as conexões
  // paradas, e o acesso seguinte usava uma conexão morta ("Não foi possível carregar esta tela").
  // Isto segura a função acordada até o pool fechar as ociosas. Fora da Vercel, não faz nada.
  attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const db = globalComPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") globalComPrisma.prisma = db;
