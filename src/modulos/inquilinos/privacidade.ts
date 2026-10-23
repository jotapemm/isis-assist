import "server-only";
import { isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import { apagarDoArmazenamento } from "@/server/armazenamento";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";
import { guardarNomeAte, NOME_APAGADO } from "./retencao";

/**
 * Direitos do titular (LGPD, art. 18): quem mora ou morou pode pedir uma cópia dos dados (acesso e
 * portabilidade) e que eles sejam apagados. A proprietária é a controladora: ela recebe o pedido e
 * usa estas funções; o Isis-Assist é o operador.
 *
 * Apagar não pode atropelar obrigação legal (art. 16, I) — nome e CPF estão nos recibos e no imposto
 * de renda dela. Por isso o apagamento tem duas etapas:
 *  1. na hora: contatos, RG, nascimento, renda, emergência, fiador, observações e documentos;
 *  2. quando passa o prazo fiscal (rotina diária): nome, CPF, contrato assinado, comprovantes e as
 *     anotações livres dos contratos e pagamentos, onde pode haver dado pessoal.
 */

const reais = (centavos: number | null) => (centavos === null ? null : centavos / 100);
const data = (d: Date | null) => (d ? isoDeDataCalendario(d) : null);

/** Tudo o que está guardado sobre a pessoa, num formato que outro sistema consegue ler (JSON). */
export async function dadosDoTitular(ctx: Contexto, id: string) {
  const [inq, config, propriedade] = await Promise.all([
    db.inquilino.findFirst({
      where: { id, organizationId: ctx.organizacaoId },
      include: {
        fiadores: true,
        arquivos: { select: { nomeOriginal: true, tipoMime: true, tamanhoBytes: true, createdAt: true } },
        contratos: {
          orderBy: { dataInicio: "asc" },
          include: {
            apartamento: { select: { identificacao: true } },
            reajustes: { orderBy: { dataBase: "asc" } },
            cobrancas: {
              orderBy: { competencia: "asc" },
              include: { pagamentos: { where: { estornadoEm: null }, orderBy: { data: "asc" } } },
            },
          },
        },
      },
    }),
    db.configuracao.findUnique({ where: { organizationId: ctx.organizacaoId }, select: { locadorNome: true } }),
    db.propriedade.findFirst({ where: { organizationId: ctx.organizacaoId }, select: { nome: true } }),
  ]);
  if (!inq) return null;

  return {
    sobre:
      "Cópia dos dados pessoais guardados no Isis-Assist sobre o titular, entregue a pedido dele (LGPD, art. 18). " +
      "Valores em reais; datas no formato AAAA-MM-DD.",
    geradoEm: new Date().toISOString(),
    controlador: { nome: config?.locadorNome ?? null, residencial: propriedade?.nome ?? null },
    titular: {
      nome: inq.nome,
      cpf: inq.cpf,
      rg: inq.rg,
      dataNascimento: data(inq.dataNascimento),
      telefone: inq.telefone,
      email: inq.email,
      profissao: inq.profissao,
      rendaMensal: reais(inq.rendaMensal),
      contatoEmergencia: {
        nome: inq.contatoEmergenciaNome,
        telefone: inq.contatoEmergenciaTelefone,
        parentesco: inq.contatoEmergenciaParentesco,
      },
      aceitaAvisosPeloWhatsapp: inq.aceitaWhatsapp,
      observacoes: inq.observacoes,
      cadastradoEm: inq.createdAt.toISOString(),
      arquivadoEm: inq.arquivadoEm?.toISOString() ?? null,
      dadosApagadosEm: inq.dadosApagadosEm?.toISOString() ?? null,
      nomeECpfGuardadosAte: data(inq.guardarNomeAte),
    },
    fiadores: inq.fiadores.map((f) => ({ nome: f.nome, cpf: f.cpf, telefone: f.telefone, email: f.email, endereco: f.endereco })),
    contratos: inq.contratos.map((c) => ({
      imovel: c.apartamento.identificacao,
      inicio: data(c.dataInicio),
      fim: data(c.dataFim),
      situacao: c.status === "ATIVO" ? "ativo" : "encerrado",
      encerradoEm: data(c.encerradoEm),
      motivoEncerramento: c.motivoEncerramento,
      aluguel: reais(c.valorAluguel),
      aluguelNaAssinatura: reais(c.valorInicial),
      diaVencimento: c.diaVencimento,
      caucao: reais(c.valorCaucao),
      caucaoDevolvida: c.caucaoDevolvidaEm ? { em: data(c.caucaoDevolvidaEm), valor: reais(c.valorCaucaoDevolvido) } : null,
      indiceReajuste: c.indiceReajuste,
      observacoes: c.observacoes,
      reajustes: c.reajustes.map((r) => ({
        dataBase: data(r.dataBase),
        percentual: Number(r.percentual),
        de: reais(r.valorAnterior),
        para: reais(r.valorNovo),
      })),
      cobrancas: c.cobrancas.map((cob) => ({
        mes: data(cob.competencia)?.slice(0, 7),
        vencimento: data(cob.vencimento),
        valor: reais(cob.valor),
        situacao: cob.status.toLowerCase(),
        pagamentos: cob.pagamentos.map((p) => ({
          data: data(p.data),
          valorPago: reais(p.valorPago),
          multa: reais(p.multa),
          juros: reais(p.juros),
          forma: p.forma,
          recibo: p.numeroRecibo,
          observacao: p.observacao,
        })),
      })),
    })),
    documentos: inq.arquivos.map((a) => ({
      nome: a.nomeOriginal,
      tipo: a.tipoMime,
      tamanhoBytes: a.tamanhoBytes,
      enviadoEm: a.createdAt.toISOString(),
    })),
  };
}

/** Etapa 1. Devolve até quando nome e CPF ficam (null = apagados já). */
export async function apagarDadosPessoais(ctx: Contexto, id: string) {
  const inq = await db.inquilino.findFirst({
    where: { id, organizationId: ctx.organizacaoId },
    select: { id: true, arquivadoEm: true, dadosApagadosEm: true, contratos: { where: { status: "ATIVO" }, select: { id: true } } },
  });
  if (!inq) return { ok: false, erro: "Esse inquilino não existe mais." } as const;
  if (inq.dadosApagadosEm) return { ok: false, erro: "Os dados dessa pessoa já foram apagados." } as const;
  if (inq.contratos.length > 0) return { ok: false, erro: "Tem contrato ativo. Encerre o contrato antes de apagar os dados." } as const;

  const [ultimo, documentos] = await Promise.all([
    db.pagamento.findFirst({
      where: { organizationId: ctx.organizacaoId, estornadoEm: null, cobranca: { contrato: { inquilinoId: id } } },
      orderBy: { data: "desc" },
      select: { data: true },
    }),
    db.arquivo.findMany({ where: { organizationId: ctx.organizacaoId, inquilinoId: id }, select: { id: true, chave: true } }),
  ]);
  const ate = guardarNomeAte(ultimo ? isoDeDataCalendario(ultimo.data) : null);
  const agora = new Date();

  await db.$transaction([
    db.arquivo.deleteMany({ where: { id: { in: documentos.map((d) => d.id) } } }),
    db.fiador.updateMany({
      where: { inquilinoId: id },
      data: { nome: "Fiador (dados apagados)", cpf: null, telefone: null, email: null, endereco: null },
    }),
    db.inquilino.update({
      where: { id },
      data: {
        rg: null,
        dataNascimento: null,
        telefone: null,
        email: null,
        profissao: null,
        rendaMensal: null,
        contatoEmergenciaNome: null,
        contatoEmergenciaTelefone: null,
        contatoEmergenciaParentesco: null,
        observacoes: null,
        aceitaWhatsapp: false,
        arquivadoEm: inq.arquivadoEm ?? agora,
        dadosApagadosEm: agora,
        guardarNomeAte: ate ? paraDataCalendario(ate) : null,
      },
    }),
  ]);
  await apagarDoArmazenamento(documentos.map((d) => d.chave));
  if (!ate) await concluirApagamento(id);
  return { ok: true, guardarAte: ate } as const;
}

/** Etapa 2: o que ficou por causa do imposto de renda. */
async function concluirApagamento(inquilinoId: string) {
  const inq = await db.inquilino.findUniqueOrThrow({
    where: { id: inquilinoId },
    select: { nome: true, contratos: { select: { id: true, apartamentoId: true } } },
  });
  const contratos = inq.contratos.map((c) => c.id);
  const [arquivos, historicos] = await Promise.all([
    db.arquivo.findMany({
      where: { OR: [{ contratoId: { in: contratos } }, { pagamento: { cobranca: { contratoId: { in: contratos } } } }] },
      select: { id: true, chave: true },
    }),
    // O histórico do imóvel diz "Contrato com Fulano" (src/modulos/contratos/acoes.ts).
    db.historicoStatus.findMany({
      where: { apartamentoId: { in: inq.contratos.map((c) => c.apartamentoId) }, motivo: { contains: inq.nome } },
      select: { id: true, motivo: true },
    }),
  ]);

  await db.$transaction([
    db.arquivo.deleteMany({ where: { id: { in: arquivos.map((a) => a.id) } } }),
    db.pagamento.updateMany({ where: { cobranca: { contratoId: { in: contratos } } }, data: { observacao: null } }),
    db.contrato.updateMany({ where: { id: { in: contratos } }, data: { observacoes: null } }),
    ...historicos.map((h) =>
      db.historicoStatus.update({ where: { id: h.id }, data: { motivo: h.motivo!.replaceAll(inq.nome, NOME_APAGADO.toLowerCase()) } }),
    ),
    db.inquilino.update({ where: { id: inquilinoId }, data: { nome: NOME_APAGADO, cpf: null, guardarNomeAte: null } }),
  ]);
  await apagarDoArmazenamento(arquivos.map((a) => a.chave));
}

/** Rotina diária: termina o apagamento de quem já passou do prazo fiscal. */
export async function concluirApagamentosVencidos(hoje: string) {
  const vencidos = await db.inquilino.findMany({
    where: { guardarNomeAte: { lt: paraDataCalendario(hoje) } },
    select: { id: true },
  });
  for (const { id } of vencidos) await concluirApagamento(id);
  return vencidos.length;
}
