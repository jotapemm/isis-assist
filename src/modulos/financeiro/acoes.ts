"use server";

import { refresh } from "next/cache";
import { formatarMoeda, isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import { falha, falhaDeValidacao, sucesso, type Resultado } from "@/lib/resultado";
import { exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";
import { regrasDaConta } from "./consultas";
import { esquemaAjusteCobranca, esquemaDespesa, esquemaPagamento } from "./esquemas";
import { calcularEncargos } from "./regras";
import { atualizarStatusDaCobranca } from "./servico";

async function cobrancaDaConta(organizacaoId: string, id: string) {
  return db.cobranca.findFirst({
    where: { id, organizationId: organizacaoId },
    select: {
      id: true,
      valor: true,
      vencimento: true,
      status: true,
      contrato: { select: { multaPercentual: true, jurosMensalPercentual: true } },
      pagamentos: { where: { estornadoEm: null }, select: { valorPrincipal: true } },
    },
  });
}

/**
 * Registra um pagamento (total ou parcial). Multa e juros são recalculados aqui — o valor que
 * veio da tela só é aceito se não passar do devido. Cada pagamento ganha o próximo número de recibo.
 */
export async function registrarPagamento(
  cobrancaId: string,
  entrada: unknown,
): Promise<Resultado<{ pagamentoId: string; numeroRecibo: number; quitou: boolean }>> {
  const ctx = await exigirContexto();
  const dados = esquemaPagamento.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;

  const cobranca = await cobrancaDaConta(ctx.organizacaoId, cobrancaId);
  if (!cobranca) return falha("Essa cobrança não existe mais.");
  if (cobranca.status === "CANCELADO") return falha("Essa cobrança foi cancelada.");

  const saldo = cobranca.valor - cobranca.pagamentos.reduce((s, p) => s + p.valorPrincipal, 0);
  if (saldo <= 0) return falha("Essa cobrança já está paga.");

  const regras = await regrasDaConta(ctx);
  const calculados = calcularEncargos(saldo, isoDeDataCalendario(cobranca.vencimento), d.data, {
    ...regras,
    multaPercentual: cobranca.contrato.multaPercentual === null ? regras.multaPercentual : Number(cobranca.contrato.multaPercentual),
    jurosMensalPercentual:
      cobranca.contrato.jurosMensalPercentual === null ? regras.jurosMensalPercentual : Number(cobranca.contrato.jurosMensalPercentual),
  });
  const dispensou = d.isentar && calculados.multa + calculados.juros > 0;
  const { multa, juros } = d.isentar ? { multa: 0, juros: 0 } : calculados;

  const devido = saldo + multa + juros;
  if (d.valorPago > devido) {
    const msg = `O valor passa do que falta pagar (${formatarMoeda(devido)}).`;
    return falha(msg, { valorPago: msg });
  }
  // Pagamento parcial paga primeiro os encargos, depois o aluguel.
  const valorPrincipal = Math.min(saldo, Math.max(0, d.valorPago - multa - juros));
  const encargosPagos = d.valorPago - valorPrincipal;
  const multaPaga = Math.min(multa, encargosPagos);

  const pagamento = await db.$transaction(async (tx) => {
    const { proximoNumeroRecibo } = await tx.configuracao.update({
      where: { organizationId: ctx.organizacaoId },
      data: { proximoNumeroRecibo: { increment: 1 } },
      select: { proximoNumeroRecibo: true },
    });
    const criado = await tx.pagamento.create({
      data: {
        organizationId: ctx.organizacaoId,
        cobrancaId: cobranca.id,
        data: paraDataCalendario(d.data),
        valorPago: d.valorPago,
        valorPrincipal,
        multa: multaPaga,
        juros: encargosPagos - multaPaga,
        forma: d.forma,
        observacao: d.observacao || (dispensou ? "Multa e juros dispensados" : null),
        numeroRecibo: proximoNumeroRecibo - 1,
        registradoPorId: ctx.usuario.id,
      },
      select: { id: true, numeroRecibo: true },
    });
    await atualizarStatusDaCobranca(cobranca.id, tx);
    return criado;
  });

  refresh();
  return sucesso({ pagamentoId: pagamento.id, numeroRecibo: pagamento.numeroRecibo, quitou: valorPrincipal >= saldo });
}

/** Desfaz um pagamento lançado por engano. Ele fica guardado (estornado) e a cobrança volta a ficar em aberto. */
export async function estornarPagamento(pagamentoId: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  const pagamento = await db.pagamento.findFirst({
    where: { id: pagamentoId, organizationId: ctx.organizacaoId, estornadoEm: null },
    select: { id: true, cobrancaId: true },
  });
  if (!pagamento) return falha("Esse pagamento já foi desfeito.");

  await db.$transaction(async (tx) => {
    await tx.pagamento.update({ where: { id: pagamento.id }, data: { estornadoEm: new Date() } });
    await atualizarStatusDaCobranca(pagamento.cobrancaId, tx);
  });
  refresh();
  return sucesso();
}

/** Muda valor/vencimento de uma cobrança ainda sem pagamento (ex.: primeiro mês proporcional, desconto combinado). */
export async function ajustarCobranca(cobrancaId: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaAjusteCobranca.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const cobranca = await cobrancaDaConta(ctx.organizacaoId, cobrancaId);
  if (!cobranca) return falha("Essa cobrança não existe mais.");
  if (cobranca.pagamentos.length > 0) return falha("Essa cobrança já tem pagamento. Desfaça o pagamento antes de ajustar.");

  await db.cobranca.update({
    where: { id: cobranca.id },
    data: { valor: dados.data.valor, vencimento: paraDataCalendario(dados.data.vencimento), descricao: dados.data.descricao || null },
  });
  refresh();
  return sucesso();
}

async function apartamentoDaConta(organizacaoId: string, apartamentoId: string) {
  if (!apartamentoId) return null;
  const apto = await db.apartamento.findFirst({ where: { id: apartamentoId, organizationId: organizacaoId }, select: { id: true } });
  return apto?.id ?? undefined;
}

export async function lancarDespesa(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaDespesa.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;

  const apartamentoId = await apartamentoDaConta(ctx.organizacaoId, d.apartamentoId);
  if (apartamentoId === undefined) return falha("Esse imóvel não existe mais.");

  await db.despesa.create({
    data: {
      organizationId: ctx.organizacaoId,
      apartamentoId,
      categoria: d.categoria,
      descricao: d.descricao,
      valor: d.valor,
      data: paraDataCalendario(d.data),
      observacao: d.observacao || null,
    },
  });
  refresh();
  return sucesso();
}

export async function editarDespesa(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaDespesa.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;

  const apartamentoId = await apartamentoDaConta(ctx.organizacaoId, d.apartamentoId);
  if (apartamentoId === undefined) return falha("Esse imóvel não existe mais.");

  const { count } = await db.despesa.updateMany({
    where: { id, organizationId: ctx.organizacaoId, removidaEm: null },
    data: {
      apartamentoId,
      categoria: d.categoria,
      descricao: d.descricao,
      valor: d.valor,
      data: paraDataCalendario(d.data),
      observacao: d.observacao || null,
    },
  });
  if (count === 0) return falha("Essa despesa não existe mais.");
  refresh();
  return sucesso();
}

/** Tira a despesa das contas (fica guardada, como tudo que é financeiro). */
export async function removerDespesa(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  await db.despesa.updateMany({ where: { id, organizationId: ctx.organizacaoId }, data: { removidaEm: new Date() } });
  refresh();
  return sucesso();
}

export async function restaurarDespesa(id: string): Promise<Resultado> {
  const ctx = await exigirContexto();
  await db.despesa.updateMany({ where: { id, organizationId: ctx.organizacaoId }, data: { removidaEm: null } });
  refresh();
  return sucesso();
}
