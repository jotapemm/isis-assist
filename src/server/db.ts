import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { configDoBanco } from "./banco-config";

// Em dev o Next recarrega os módulos a cada edição; guardar o cliente no globalThis
// evita abrir um pool de conexões novo a cada recarga.
const globalComPrisma = globalThis as unknown as { prisma?: PrismaClient };

function criarCliente() {
  const adapter = new PrismaPg(configDoBanco());
  return new PrismaClient({ adapter });
}

export const db = globalComPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") globalComPrisma.prisma = db;
