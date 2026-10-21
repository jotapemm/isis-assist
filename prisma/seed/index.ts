/**
 * Dados de demonstração — para apresentar o Isis-Assist e testar no dia a dia.
 * Uso: npm run db:seed   (refaz do zero a conta de demonstração; não mexe em outras contas)
 *
 * Cresce a cada fase: hoje cria o acesso, a conta e o residencial; na Fase 1 entram os
 * 12 apartamentos e os inquilinos; depois contratos, 12 meses de pagamentos, etc.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const EMAIL = process.env.SEED_EMAIL ?? "demo@isis-assist.app";
const SENHA = process.env.SEED_SENHA ?? "isis-demo-2026";

async function main() {
  // Recomeça do zero só a conta de demonstração (organizações em cascata levam o resto).
  const antigo = await db.user.findUnique({ where: { email: EMAIL }, include: { members: true } });
  if (antigo) {
    await db.organization.deleteMany({ where: { id: { in: antigo.members.map((m) => m.organizationId) } } });
    await db.user.delete({ where: { id: antigo.id } });
  }

  const agora = new Date();
  const userId = randomUUID();
  const organizationId = randomUUID();

  await db.$transaction([
    db.user.create({
      data: { id: userId, name: "Maria Aparecida Souza", email: EMAIL, emailVerified: true },
    }),
    // É assim que o Better Auth guarda login por e-mail e senha: uma "account" do provedor "credential".
    db.account.create({
      data: { id: randomUUID(), userId, accountId: userId, providerId: "credential", password: await hashPassword(SENHA) },
    }),
    db.organization.create({
      data: { id: organizationId, name: "Residencial Isis", slug: "residencial-isis-demo", createdAt: agora },
    }),
    db.member.create({
      data: { id: randomUUID(), organizationId, userId, role: "owner", createdAt: agora },
    }),
    db.configuracao.create({
      data: {
        organizationId,
        locadorNome: "Maria Aparecida Souza",
        locadorDocumento: "52998224725",
        locadorTelefone: "11987654321",
        locadorEmail: EMAIL,
        chavePix: EMAIL,
        multaPercentual: 10,
        jurosMensalPercentual: 1,
        diasCarencia: 3,
      },
    }),
    db.propriedade.create({
      data: {
        organizationId,
        nome: "Residencial Isis",
        cep: "13010111",
        logradouro: "Rua das Acácias",
        numero: "250",
        bairro: "Jardim das Flores",
        cidade: "Campinas",
        uf: "SP",
      },
    }),
  ]);

  console.log(`Conta de demonstração pronta: ${EMAIL} (senha em SEED_SENHA no .env).`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
