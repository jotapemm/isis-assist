/**
 * Dados de demonstração — para apresentar o Isis-Assist e testar no dia a dia.
 * Uso: npm run db:seed   (refaz do zero a conta de demonstração; não mexe em outras contas)
 *
 * Cresce a cada fase: acesso, conta e residencial (Fase 0); 12 apartamentos com histórico e
 * 10 inquilinos (Fase 1); depois contratos, 12 meses de pagamentos, etc.
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../../src/generated/prisma/client";
import { APARTAMENTOS, celularFicticio, cpfFicticio, emailFicticio, INQUILINOS, rgFicticio } from "./dados";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const EMAIL = process.env.SEED_EMAIL ?? "demo@isis-assist.app";
const SENHA = process.env.SEED_SENHA ?? "isis-demo-2026";

async function main() {
  // Recomeça do zero só a conta de demonstração (organizações em cascata levam o resto).
  const antigo = await db.user.findUnique({ where: { email: EMAIL }, include: { members: true } });
  if (antigo) {
    const contas = antigo.members.map((m) => m.organizationId);
    // Fotos e documentos enviados na demonstração ficam fora do banco (src/server/armazenamento.ts).
    const pastaArquivos = process.env.ARMAZENAMENTO_DIR ?? path.join(process.cwd(), ".armazenamento");
    for (const conta of contas) await rm(path.join(pastaArquivos, conta), { recursive: true, force: true });
    await db.organization.deleteMany({ where: { id: { in: contas } } });
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

  const propriedade = await db.propriedade.findFirstOrThrow({ where: { organizationId } });
  await semearApartamentos(organizationId, propriedade.id, userId);
  await semearInquilinos(organizationId);

  console.log(`Conta de demonstração pronta: ${EMAIL} (senha em SEED_SENHA no .env).`);
}

const DIA = 24 * 60 * 60 * 1000;
const diasAtras = (dias: number) => new Date(Date.now() - dias * DIA);

/** Fase 1: os 12 aptos, cada um com o histórico que explica o status atual. */
async function semearApartamentos(organizationId: string, propriedadeId: string, usuarioId: string) {
  for (const [i, apto] of APARTAMENTOS.entries()) {
    const doisQuartos = apto.identificacao.endsWith("04");
    const cadastradoEm = diasAtras(400 - i);
    await db.apartamento.create({
      data: {
        organizationId,
        propriedadeId,
        identificacao: apto.identificacao,
        andar: apto.andar,
        quartos: doisQuartos ? 2 : 1,
        areaM2: doisQuartos ? 58 : 42,
        valorReferencia: 125000 + apto.andar * 10000 + (doisQuartos ? 20000 : 0),
        descricao: doisQuartos
          ? "Dois quartos, sala, cozinha e área de serviço. Fica na ponta, com janela para a rua."
          : "Quarto, sala conjugada com cozinha americana e banheiro.",
        status: apto.status,
        createdAt: cadastradoEm,
        historicoStatus: {
          create: [
            { organizationId, para: "LIVRE", motivo: "Cadastro do apartamento", usuarioId, createdAt: cadastradoEm },
            ...(apto.status === "LIVRE"
              ? []
              : [
                  {
                    organizationId,
                    de: "LIVRE" as const,
                    para: apto.status,
                    motivo: apto.motivo ?? "Inquilino mudou",
                    usuarioId,
                    createdAt: diasAtras(apto.status === "OCUPADO" ? 300 - i * 15 : 6 + i),
                  },
                ]),
          ],
        },
      },
    });
  }
}

/** Fase 1: inquilinos com contato de emergência e, alguns, fiador. Os contratos que os ligam aos aptos vêm na Fase 2. */
async function semearInquilinos(organizationId: string) {
  for (const inq of INQUILINOS) {
    const [emergenciaNome, parentesco] = inq.emergencia;
    await db.inquilino.create({
      data: {
        organizationId,
        nome: inq.nome,
        cpf: cpfFicticio(),
        rg: rgFicticio(),
        dataNascimento: new Date(`${inq.nascimento}T00:00:00Z`),
        telefone: celularFicticio(),
        email: emailFicticio(inq.nome),
        profissao: inq.profissao,
        rendaMensal: inq.renda,
        contatoEmergenciaNome: emergenciaNome,
        contatoEmergenciaTelefone: celularFicticio(),
        contatoEmergenciaParentesco: parentesco,
        fiadores:
          "fiador" in inq
            ? { create: { organizationId, nome: inq.fiador, cpf: cpfFicticio(), telefone: celularFicticio() } }
            : undefined,
      },
    });
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
