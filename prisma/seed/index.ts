/**
 * Dados de demonstração — para apresentar o Isis-Assist e testar no dia a dia.
 * Uso: npm run db:seed   (refaz do zero a conta de demonstração; não mexe em outras contas)
 *
 * Cresce a cada fase: acesso, conta e residencial (Fase 0); 12 apartamentos com histórico e
 * 10 inquilinos (Fase 1); contratos e reajustes (Fase 2); 12 meses de aluguéis, recibos e despesas (Fase 3).
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../../src/generated/prisma/client";
import { configDoBanco } from "../../src/server/banco-config";
import { fimDoContrato, somarDias, somarMeses } from "../../src/lib/datas";
import { hojeISO, isoDeDataCalendario, paraDataCalendario } from "../../src/lib/formatar";
import { calcularEncargos, competenciaDe, vencimentoNoMes } from "../../src/modulos/financeiro/regras";
import { VERSAO_TERMOS } from "../../src/modulos/legal/versao";
import {
  APARTAMENTOS,
  celularFicticio,
  CONTRATOS,
  cpfFicticio,
  DESPESAS_AVULSAS,
  DESPESAS_MENSAIS,
  emailFicticio,
  INQUILINOS,
  PRESTADORES,
  rgFicticio,
  sorteador,
} from "./dados";

const db = new PrismaClient({ adapter: new PrismaPg(configDoBanco()) });

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
      data: { id: userId, name: "Maria Aparecida Souza", email: EMAIL, emailVerified: true, termosVersao: VERSAO_TERMOS, termosAceitosEm: agora },
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
  await semearFinanceiro(organizationId, userId);
  await semearManutencoes(organizationId, userId);

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
            { organizationId, para: "LIVRE", usuarioId, createdAt: cadastradoEm },
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
        // Quase todos aceitaram avisos pelo WhatsApp; a Beatriz não, para a demonstração mostrar o "não".
        aceitaWhatsapp: !("semWhatsapp" in inq),
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

/**
 * Fase 3: 12 meses de aluguéis e despesas. Quase todos pagam em dia (alguns dias antes, ou um ou dois
 * depois, dentro da tolerância); para a demonstração ter o que mostrar, o 103 está com os dois últimos
 * meses em aberto, o 201 pagou só metade do mês passado e o 304 pagou um mês com 15 dias de atraso.
 * O que vence nos próximos dias fica pendente — depende do dia em que o seed roda.
 */
async function semearFinanceiro(organizationId: string, usuarioId: string) {
  const hoje = hojeISO();
  const mesAtual = competenciaDe(hoje);
  const regras = { multaPercentual: 10, jurosMensalPercentual: 1, diasCarencia: 3 };
  const sorte = sorteador(1125);
  const entre = (min: number, max: number) => min + Math.floor(sorte() * (max - min + 1));

  const contratos = await db.contrato.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      dataInicio: true,
      diaVencimento: true,
      valorInicial: true,
      encerradoEm: true,
      apartamento: { select: { identificacao: true } },
      reajustes: { orderBy: { dataBase: "asc" }, select: { dataBase: true, valorNovo: true } },
    },
  });

  type Recebido = {
    cobrancaId: string;
    data: string;
    valorPago: number;
    valorPrincipal: number;
    multa: number;
    juros: number;
    forma: "PIX" | "DINHEIRO" | "TRANSFERENCIA";
    observacao: string | null;
  };
  const recebidos: Recebido[] = [];

  for (const c of contratos) {
    const inicio = isoDeDataCalendario(c.dataInicio);
    const fim = c.encerradoEm ? isoDeDataCalendario(c.encerradoEm) : null;
    const apto = c.apartamento.identificacao;
    const forma = apto === "202" ? "TRANSFERENCIA" : apto === "304" ? "DINHEIRO" : "PIX";

    for (let m = -11; m <= 0; m++) {
      const competencia = somarMeses(mesAtual, m);
      // Mesma regra de garantirCobrancas: vencimento antes do início do contrato fica para o mês seguinte.
      const vencimento = vencimentoNoMes(competencia, c.diaVencimento);
      if (vencimento < inicio || (fim && vencimento > fim)) continue;
      const valor = c.reajustes.reduce((v, r) => (isoDeDataCalendario(r.dataBase) <= vencimento ? r.valorNovo : v), c.valorInicial);

      // Quando e quanto entrou (null = ainda não pagou).
      let pagamento: Omit<Recebido, "cobrancaId" | "forma"> | null = null;
      if (apto === "103" && m >= -1) {
        pagamento = null;
      } else if (apto === "201" && m === -1) {
        const metade = Math.round(valor / 2);
        pagamento = { data: vencimento, valorPago: metade, valorPrincipal: metade, multa: 0, juros: 0, observacao: "Pagou metade; disse que acerta o resto no fim do mês" };
      } else if (apto === "304" && m === -3) {
        const data = somarDias(vencimento, 15);
        const { multa, juros } = calcularEncargos(valor, vencimento, data, regras);
        pagamento = { data, valorPago: valor + multa + juros, valorPrincipal: valor, multa, juros, observacao: null };
      } else {
        const data = somarDias(vencimento, -entre(-2, 4));
        pagamento = data <= hoje ? { data, valorPago: valor, valorPrincipal: valor, multa: 0, juros: 0, observacao: null } : null;
      }

      const cobranca = await db.cobranca.create({
        data: {
          organizationId,
          contratoId: c.id,
          competencia: paraDataCalendario(competencia),
          vencimento: paraDataCalendario(vencimento),
          valor,
          chaveGeracao: `${c.id}:${competencia.slice(0, 7)}`,
          status: !pagamento ? "PENDENTE" : pagamento.valorPrincipal >= valor ? "PAGO" : "PARCIAL",
          createdAt: meioDia(competencia),
        },
        select: { id: true },
      });
      if (pagamento) recebidos.push({ cobrancaId: cobranca.id, forma, ...pagamento });
    }
  }

  // Recibos numerados na ordem em que o dinheiro entrou.
  recebidos.sort((a, b) => a.data.localeCompare(b.data));
  await db.pagamento.createMany({
    data: recebidos.map(({ data, ...r }, i) => ({
      organizationId,
      ...r,
      data: paraDataCalendario(data),
      numeroRecibo: i + 1,
      registradoPorId: usuarioId,
      createdAt: meioDia(data),
    })),
  });
  await db.configuracao.update({ where: { organizationId }, data: { proximoNumeroRecibo: recebidos.length + 1 } });

  // Despesas: as contas do mês e os gastos avulsos, nunca depois de hoje.
  const aptos = await db.apartamento.findMany({ where: { organizationId }, select: { id: true, identificacao: true } });
  const idDoApto = (identificacao?: string) => aptos.find((a) => a.identificacao === identificacao)?.id ?? null;
  const despesas = [];
  for (let m = -11; m <= 0; m++) {
    const competencia = somarMeses(mesAtual, m);
    const mes = Number(competencia.slice(5, 7));
    const mensais = DESPESAS_MENSAIS.map((d) => ({ ...d, valor: entre(...d.faixa) }));
    // IPTU em 10 parcelas, de fevereiro a novembro.
    if (mes >= 2 && mes <= 11) {
      mensais.push({ categoria: "IPTU", descricao: `IPTU ${competencia.slice(0, 4)} — parcela ${mes - 1} de 10`, dia: 10, faixa: [0, 0], valor: 310_00 });
    }
    for (const d of mensais) {
      const data = vencimentoNoMes(competencia, d.dia);
      if (data <= hoje) despesas.push({ categoria: d.categoria, descricao: d.descricao, valor: d.valor, data, apartamentoId: null, observacao: null });
    }
  }
  for (const d of DESPESAS_AVULSAS) {
    const proposta = vencimentoNoMes(somarMeses(mesAtual, -d.mesesAtras), d.dia);
    const data = proposta <= hoje ? proposta : hoje;
    despesas.push({ categoria: d.categoria, descricao: d.descricao, valor: d.valor, data, apartamentoId: idDoApto(d.apto), observacao: d.observacao ?? null });
  }
  await db.despesa.createMany({
    data: despesas.map(({ data, ...d }) => ({ organizationId, ...d, data: paraDataCalendario(data), createdAt: meioDia(data) })),
  });

  const emAberto = await db.cobranca.count({ where: { organizationId, status: { in: ["PENDENTE", "PARCIAL"] } } });
  console.log(`Financeiro: ${recebidos.length} pagamentos, ${emAberto} cobranças em aberto e ${despesas.length} despesas.`);
}

/**
 * Fase 4: prestadores e ordens de serviço que conversam com o resto da demonstração — o vazamento do
 * 301 (em Manutenção), a reforma do 104, a tomada do 202 (ocupado: selo 🔧 no mapa) e as despesas de
 * conserto do Financeiro, ligadas à OS que as gerou.
 */
async function semearManutencoes(organizationId: string, usuarioId: string) {
  const hoje = hojeISO();
  const prestador = new Map<string, string>();
  for (const p of PRESTADORES) {
    const { id } = await db.prestador.create({
      data: { organizationId, ...p, telefone: celularFicticio(), createdAt: diasAtras(400) },
      select: { id: true },
    });
    prestador.set(p.especialidade, id);
  }
  const aptos = await db.apartamento.findMany({ where: { organizationId }, select: { id: true, identificacao: true } });
  const apto = (identificacao: string) => aptos.find((a) => a.identificacao === identificacao)!.id;
  const despesa = async (descricao: string) => {
    const d = await db.despesa.findFirstOrThrow({ where: { organizationId, descricao }, select: { id: true, data: true } });
    return { id: d.id, data: isoDeDataCalendario(d.data) };
  };
  // O 301 entrou em Manutenção no seed dos apartamentos; a OS do vazamento é a dona dessa mudança.
  const historico301 = await db.historicoStatus.findFirstOrThrow({
    where: { organizationId, apartamentoId: apto("301"), para: "MANUTENCAO" },
    select: { id: true, createdAt: true },
  });

  const [portao, chuveiro, pintura] = await Promise.all([
    despesa("Conserto do motor do portão"),
    despesa("Troca da resistência do chuveiro"),
    despesa("Pintura completa"),
  ]);
  const ordens = [
    { titulo: "Motor do portão travando", prioridade: "ALTA", status: "CONCLUIDA", prestador: "Serralheiro", abertaEm: somarDias(portao.data, -3), concluidaEm: portao.data, custoFinal: 350_00, despesaId: portao.id, solucao: "Trocou a engrenagem do motor e lubrificou o trilho." },
    { titulo: "Chuveiro não esquenta", apto: "102", prioridade: "MEDIA", status: "CONCLUIDA", prestador: "Eletricista", abertaEm: somarDias(chuveiro.data, -2), concluidaEm: chuveiro.data, custoFinal: 85_00, despesaId: chuveiro.id, solucao: "Resistência queimada; trocada por uma de 7.500 W." },
    { titulo: "Pintura completa", apto: "104", prioridade: "MEDIA", status: "CONCLUIDA", prestador: "Pintor", abertaEm: somarDias(pintura.data, -20), concluidaEm: pintura.data, custoEstimado: 3000_00, custoFinal: 2800_00, despesaId: pintura.id, descricao: "Paredes e teto de todos os cômodos, com massa corrida na sala." },
    { titulo: "Troca do piso da cozinha", apto: "104", prioridade: "ALTA", status: "EM_ANDAMENTO", prestador: "Pedreiro", abertaEm: somarDias(pintura.data, 2), custoEstimado: 1800_00, descricao: "Piso cerâmico trincado em várias peças. Orçamento com material." },
    { titulo: "Vazamento no banheiro", apto: "301", prioridade: "URGENTE", status: "EM_ANDAMENTO", prestador: "Encanador", abertaEm: hojeISO(historico301.createdAt), custoEstimado: 450_00, statusAnteriorApto: "LIVRE", descricao: "Água vazando atrás do vaso e manchando o teto do 201." },
    { titulo: "Tomada da cozinha sem energia", apto: "202", prioridade: "MEDIA", status: "ABERTA", prestador: "Eletricista", abertaEm: somarDias(hoje, -3), descricao: "A Fernanda avisou pelo WhatsApp. Já testou o disjuntor." },
    { titulo: "Lâmpada queimada no corredor do 2º andar", prioridade: "BAIXA", status: "ABERTA", abertaEm: somarDias(hoje, -1) },
  ] as const;

  const numeradas = [...ordens].sort((a, b) => a.abertaEm.localeCompare(b.abertaEm));
  for (const [i, os] of numeradas.entries()) {
    const numero = i + 1;
    const criada = await db.ordemServico.create({
      data: {
        organizationId,
        numero,
        apartamentoId: "apto" in os ? apto(os.apto) : null,
        prestadorId: "prestador" in os ? prestador.get(os.prestador)! : null,
        titulo: os.titulo,
        descricao: "descricao" in os ? os.descricao : null,
        prioridade: os.prioridade,
        status: os.status,
        custoEstimado: "custoEstimado" in os ? os.custoEstimado : null,
        custoFinal: "custoFinal" in os ? os.custoFinal : null,
        abertaEm: paraDataCalendario(os.abertaEm),
        concluidaEm: "concluidaEm" in os ? paraDataCalendario(os.concluidaEm) : null,
        solucao: "solucao" in os ? os.solucao : null,
        statusAnteriorApto: "statusAnteriorApto" in os ? os.statusAnteriorApto : null,
        createdAt: meioDia(os.abertaEm),
      },
      select: { id: true },
    });
    if ("despesaId" in os) {
      await db.despesa.update({
        where: { id: os.despesaId },
        data: { ordemServicoId: criada.id, descricao: `${os.titulo} (OS ${String(numero).padStart(4, "0")})` },
      });
    }
    if (os.titulo === "Vazamento no banheiro") {
      await db.historicoStatus.update({
        where: { id: historico301.id },
        data: { origem: "MANUTENCAO", motivo: `OS ${String(numero).padStart(4, "0")}: ${os.titulo}`, usuarioId },
      });
    }
  }
  await db.configuracao.update({ where: { organizationId }, data: { proximoNumeroOS: numeradas.length + 1 } });
  console.log(`Manutenções: ${PRESTADORES.length} prestadores e ${numeradas.length} ordens de serviço.`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
