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
import { fimDoContrato, somarDias, somarMeses } from "../../src/lib/datas";
import { hojeISO, paraDataCalendario } from "../../src/lib/formatar";
import { APARTAMENTOS, celularFicticio, CONTRATOS, cpfFicticio, emailFicticio, INQUILINOS, rgFicticio } from "./dados";

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
  await semearContratos(organizationId, userId);

  console.log(`Conta de demonstração pronta: ${EMAIL} (senha em SEED_SENHA no .env).`);
}

const DIA = 24 * 60 * 60 * 1000;
/** Momento ao meio-dia de Brasília (15h UTC) de uma data — meia-noite UTC apareceria como 21h do dia anterior. */
const meioDia = (iso: string) => new Date(`${iso}T15:00:00Z`);
const diasAtras = (dias: number) => new Date(Date.now() - dias * DIA);

/** Fase 1: os 12 aptos, cada um com o histórico que explica o status atual. */
async function semearApartamentos(organizationId: string, propriedadeId: string, usuarioId: string) {
  for (const [i, apto] of APARTAMENTOS.entries()) {
    const doisQuartos = apto.identificacao.endsWith("04");
    const cadastradoEm = diasAtras(900 - i);
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
            // Ocupados ganham o histórico pelo contrato (semearContratos).
            ...(apto.status === "LIVRE" || apto.status === "OCUPADO"
              ? []
              : [
                  {
                    organizationId,
                    de: "LIVRE" as const,
                    para: apto.status,
                    motivo: apto.motivo,
                    usuarioId,
                    createdAt: diasAtras(6 + i),
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

/**
 * Fase 2: contratos dos 8 aptos ocupados e um encerrado (203). As datas são relativas a hoje para a
 * demonstração sempre ter um reajuste chegando, um atrasado e um contrato terminando.
 * Os reajustes passados são registros de exemplo — índices reais vêm do Banco Central na hora de aplicar.
 */
async function semearContratos(organizationId: string, usuarioId: string) {
  const hoje = hojeISO();
  const apto = async (identificacao: string) =>
    db.apartamento.findFirstOrThrow({ where: { organizationId, identificacao }, select: { id: true, valorReferencia: true } });
  const inquilino = async (nome: string) =>
    db.inquilino.findFirstOrThrow({ where: { organizationId, nome }, select: { id: true, nome: true, fiadores: { select: { id: true } } } });

  for (const c of CONTRATOS) {
    const inicio = somarDias(somarMeses(hoje, -c.mesesAtras), c.ajusteDias ?? 0);
    const fim = fimDoContrato(inicio, c.meses);
    const [a, inq] = await Promise.all([apto(c.apto), inquilino(c.inquilino)]);
    const valorInicial = a.valorReferencia ?? 140000;

    // Reajustes já aplicados: um por aniversário que passou, exceto o que a demo deixa atrasado.
    let valor = valorInicial;
    const reajustes = c.reajustes.map((percentual, i) => {
      const dataBase = somarMeses(inicio, 12 * (i + 1));
      const novo = Math.round(valor * (1 + percentual / 100));
      const registro = { dataBase, percentual, valorAnterior: valor, valorNovo: novo };
      valor = novo;
      return registro;
    });
    const encerrado = c.encerrado ?? false;
    const proximoReajuste = c.indice === "NENHUM" || encerrado ? null : somarMeses(inicio, 12 * (c.reajustes.length + 1));

    await db.contrato.create({
      data: {
        organizationId,
        apartamentoId: a.id,
        inquilinoId: inq.id,
        fiadorId: inq.fiadores[0]?.id ?? null,
        dataInicio: paraDataCalendario(inicio),
        dataFim: paraDataCalendario(fim),
        valorAluguel: valor,
        valorInicial,
        diaVencimento: c.dia,
        valorCaucao: c.caucao ? valorInicial * c.caucao : null,
        indiceReajuste: c.indice,
        percentualFixo: c.indice === "FIXO" ? 5 : null,
        proximoReajusteEm: proximoReajuste ? paraDataCalendario(proximoReajuste) : null,
        status: encerrado ? "ENCERRADO" : "ATIVO",
        encerradoEm: encerrado ? paraDataCalendario(fim) : null,
        motivoEncerramento: encerrado ? "Fim do prazo" : null,
        caucaoDevolvidaEm: encerrado && c.caucao ? paraDataCalendario(fim) : null,
        valorCaucaoDevolvido: encerrado && c.caucao ? valorInicial * c.caucao : null,
        createdAt: meioDia(inicio),
        reajustes: {
          create: reajustes.map((r) => ({
            organizationId,
            dataBase: paraDataCalendario(r.dataBase),
            indice: c.indice,
            percentual: r.percentual,
            valorAnterior: r.valorAnterior,
            valorNovo: r.valorNovo,
            observacao: r.percentual === 0 ? "Índice negativo; valor mantido" : null,
            aplicadoPorId: usuarioId,
            createdAt: meioDia(r.dataBase),
          })),
        },
      },
    });

    // Histórico do apto: entrou pelo contrato; o encerrado devolve o apto para Livre.
    await db.historicoStatus.createMany({
      data: [
        { organizationId, apartamentoId: a.id, de: "LIVRE", para: "OCUPADO", origem: "CONTRATO", motivo: `Contrato com ${inq.nome}`, usuarioId, createdAt: meioDia(inicio) },
        ...(encerrado
          ? [{ organizationId, apartamentoId: a.id, de: "OCUPADO" as const, para: "LIVRE" as const, origem: "CONTRATO" as const, motivo: `Fim do contrato com ${inq.nome}`, usuarioId, createdAt: meioDia(fim) }]
          : []),
      ],
    });
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
