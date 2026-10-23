import "server-only";
import { diasEntre } from "@/lib/datas";
import { hojeISO, isoDeDataCalendario } from "@/lib/formatar";
import type { Contexto } from "@/server/contexto";
import { db } from "@/server/db";
import { AVISO_FIM_DIAS, AVISO_REAJUSTE_DIAS } from "./limites";
import { tipoDaConta } from "../apartamentos/consultas";
import { compararIdentificacao, STATUS, type StatusApartamento } from "../apartamentos/status";


const iso = (d: Date | null) => (d ? isoDeDataCalendario(d) : null);

/** Datas como texto e os prazos já calculados — o que as telas precisam, sem Decimal nem Date. */
function resumir<
  T extends {
    dataInicio: Date;
    dataFim: Date;
    proximoReajusteEm: Date | null;
    encerradoEm: Date | null;
    status: "ATIVO" | "ENCERRADO";
  },
>(c: T, hoje: string) {
  const dataFim = iso(c.dataFim)!;
  const proximoReajusteEm = iso(c.proximoReajusteEm);
  const ativo = c.status === "ATIVO";
  return {
    ...c,
    dataInicio: iso(c.dataInicio)!,
    dataFim,
    proximoReajusteEm,
    encerradoEm: iso(c.encerradoEm),
    diasParaFim: ativo ? diasEntre(hoje, dataFim) : null,
    diasParaReajuste: ativo && proximoReajusteEm ? diasEntre(hoje, proximoReajusteEm) : null,
  };
}

export async function listarContratos(ctx: Contexto) {
  const hoje = hojeISO();
  const contratos = await db.contrato.findMany({
    where: { organizationId: ctx.organizacaoId },
    select: {
      id: true,
      status: true,
      dataInicio: true,
      dataFim: true,
      valorAluguel: true,
      diaVencimento: true,
      indiceReajuste: true,
      proximoReajusteEm: true,
      encerradoEm: true,
      apartamento: { select: { id: true, identificacao: true } },
      inquilino: { select: { id: true, nome: true, telefone: true } },
    },
  });
  return contratos
    .map((c) => resumir(c, hoje))
    .sort(
      (a, b) =>
        (a.status === b.status ? 0 : a.status === "ATIVO" ? -1 : 1) ||
        compararIdentificacao(a.apartamento.identificacao, b.apartamento.identificacao) ||
        b.dataInicio.localeCompare(a.dataInicio),
    );
}

export type ContratoResumo = Awaited<ReturnType<typeof listarContratos>>[number];

export async function obterContrato(ctx: Contexto, id: string) {
  const contrato = await db.contrato.findFirst({
    where: { id, organizationId: ctx.organizacaoId },
    include: {
      apartamento: { select: { id: true, identificacao: true, andar: true, status: true } },
      inquilino: {
        select: { id: true, nome: true, telefone: true, email: true, cpf: true, aceitaWhatsapp: true, fiadores: { select: { id: true, nome: true } } },
      },
      fiador: { select: { id: true, nome: true, telefone: true } },
      reajustes: {
        orderBy: { dataBase: "desc" },
        select: {
          id: true,
          dataBase: true,
          indice: true,
          percentual: true,
          valorAnterior: true,
          valorNovo: true,
          observacao: true,
          createdAt: true,
          aplicadoPor: { select: { name: true } },
        },
      },
      arquivos: {
        where: { categoria: "CONTRATO_PDF" },
        orderBy: { createdAt: "desc" },
        select: { id: true, nomeOriginal: true, tipoMime: true, tamanhoBytes: true, createdAt: true },
      },
    },
  });
  if (!contrato) return null;

  const { percentualFixo, multaPercentual, jurosMensalPercentual, caucaoDevolvidaEm, reajustes, ...resto } = contrato;
  return {
    ...resumir(resto, hojeISO()),
    percentualFixo: percentualFixo === null ? null : Number(percentualFixo),
    multaPercentual: multaPercentual === null ? null : Number(multaPercentual),
    jurosMensalPercentual: jurosMensalPercentual === null ? null : Number(jurosMensalPercentual),
    caucaoDevolvidaEm: iso(caucaoDevolvidaEm),
    reajustes: reajustes.map((r) => ({ ...r, dataBase: iso(r.dataBase)!, percentual: Number(r.percentual) })),
  };
}

export type ContratoDetalhe = NonNullable<Awaited<ReturnType<typeof obterContrato>>>;

/** Tudo que o assistente de novo contrato precisa: aptos com situação e inquilinos com fiador. */
export async function dadosParaNovoContrato(ctx: Contexto) {
  const [tipo, aptos, inquilinos] = await Promise.all([
    tipoDaConta(ctx),
    db.apartamento.findMany({
      where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
      select: {
        id: true,
        identificacao: true,
        andar: true,
        status: true,
        valorReferencia: true,
        contratos: { where: { status: "ATIVO" }, select: { inquilino: { select: { nome: true } } }, take: 1 },
      },
    }),
    db.inquilino.findMany({
      where: { organizationId: ctx.organizacaoId, arquivadoEm: null },
      select: {
        id: true,
        nome: true,
        cpf: true,
        telefone: true,
        fiadores: { select: { id: true, nome: true }, take: 1 },
        contratos: { where: { status: "ATIVO" }, select: { apartamento: { select: { identificacao: true } } } },
      },
    }),
  ]);

  return {
    tipo,
    aptos: aptos
      .map(({ contratos, ...a }) => ({ ...a, inquilinoAtual: contratos[0]?.inquilino.nome ?? null }))
      .sort((a, b) => (a.andar ?? -1) - (b.andar ?? -1) || compararIdentificacao(a.identificacao, b.identificacao)),
    inquilinos: inquilinos
      .map(({ fiadores, contratos, ...i }) => ({
        ...i,
        fiador: fiadores[0] ?? null,
        aptosAtuais: contratos.map((c) => c.apartamento.identificacao),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })),
  };
}

export type DadosAssistente = Awaited<ReturnType<typeof dadosParaNovoContrato>>;

/** Para o painel: reajustes chegando e contratos terminando. */
export async function avisosDeContratos(ctx: Contexto) {
  const hoje = hojeISO();
  const ativos = (await listarContratos(ctx)).filter((c) => c.status === "ATIVO");
  return {
    reajustes: ativos
      .filter((c) => c.diasParaReajuste !== null && c.diasParaReajuste <= AVISO_REAJUSTE_DIAS)
      .sort((a, b) => a.diasParaReajuste! - b.diasParaReajuste!),
    terminando: ativos
      .filter((c) => c.diasParaFim !== null && c.diasParaFim <= AVISO_FIM_DIAS)
      .sort((a, b) => a.diasParaFim! - b.diasParaFim!),
    hoje,
  };
}

/** Mensagem para quem tenta mudar à mão o status de um apto com contrato ativo. */
export async function bloqueioPorContrato(organizacaoId: string, apartamentoId: string, novoStatus: StatusApartamento) {
  if (novoStatus === "OCUPADO") return null;
  const ativo = await db.contrato.findFirst({
    where: { organizationId: organizacaoId, apartamentoId, status: "ATIVO" },
    select: { inquilino: { select: { nome: true } } },
  });
  return ativo
    ? `Este imóvel tem contrato ativo com ${ativo.inquilino.nome}. Para deixá-lo ${STATUS[novoStatus].rotulo}, encerre o contrato primeiro.`
    : null;
}
