"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { mesAbreviado, proximoAniversario, somarMeses } from "@/lib/datas";
import { formatarData, hojeISO, isoDeDataCalendario, paraDataCalendario } from "@/lib/formatar";
import { somenteDigitos } from "@/lib/mascaras";
import { falha, falhaDeValidacao, sucesso, type Resultado } from "@/lib/resultado";
import { exigirContexto } from "@/server/contexto";
import { db } from "@/server/db";
import { variacoesDoPeriodo } from "@/server/indices";
import {
  esquemaEditarContrato,
  esquemaEncerrar,
  esquemaNovoContrato,
  esquemaReajuste,
  numeroDePercentual,
} from "./esquemas";
import { acumular, aplicarPercentual, INDICES, type IndiceReajuste, periodoDoIndice } from "./reajuste";

/** Ativa um contrato: apto vira Ocupado, com histórico — tudo ou nada. */
export async function criarContrato(entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaNovoContrato.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;

  const apto = await db.apartamento.findFirst({
    where: { id: d.apartamentoId, organizationId: ctx.organizacaoId, arquivadoEm: null },
    select: { id: true, identificacao: true },
  });
  if (!apto) return falha("Esse apartamento não existe mais.");

  let inquilino: { id: string; nome: string } | null = null;
  let fiadorId: string | null = null;
  if (d.cadastrarInquilino) {
    const cpf = somenteDigitos(d.novoInquilino.cpf);
    if (cpf) {
      const dono = await db.inquilino.findFirst({ where: { organizationId: ctx.organizacaoId, cpf }, select: { nome: true } });
      if (dono) {
        const msg = `Esse CPF já está no cadastro de ${dono.nome}. Escolha ${dono.nome.split(" ")[0]} na lista.`;
        return falha(msg, { "novoInquilino.cpf": msg });
      }
    }
  } else {
    const escolhido = await db.inquilino.findFirst({
      where: { id: d.inquilinoId, organizationId: ctx.organizacaoId, arquivadoEm: null },
      select: { id: true, nome: true, fiadores: { select: { id: true } } },
    });
    if (!escolhido) return falha("Esse inquilino não existe mais.");
    inquilino = { id: escolhido.id, nome: escolhido.nome };
    // Só aceita o fiador se ele for mesmo deste inquilino.
    if (escolhido.fiadores.some((f) => f.id === d.fiadorId)) fiadorId = d.fiadorId;
  }

  const resultado = await db.$transaction(async (tx): Promise<{ conflito: string } | { id: string }> => {
    // Trava o apto: dois "Ativar" seguidos não criam dois contratos para o mesmo apartamento.
    await tx.$queryRaw`SELECT id FROM apartamento WHERE id = ${apto.id} FOR UPDATE`;
    const ativo = await tx.contrato.findFirst({
      where: { apartamentoId: apto.id, status: "ATIVO" },
      select: { inquilino: { select: { nome: true } } },
    });
    if (ativo) return { conflito: `O apto ${apto.identificacao} já tem contrato ativo com ${ativo.inquilino.nome}.` };

    const morador =
      inquilino ??
      (await tx.inquilino.create({
        data: {
          organizationId: ctx.organizacaoId,
          nome: d.novoInquilino.nome,
          cpf: somenteDigitos(d.novoInquilino.cpf) || null,
          telefone: somenteDigitos(d.novoInquilino.telefone) || null,
        },
        select: { id: true, nome: true },
      }));

    const contrato = await tx.contrato.create({
      data: {
        organizationId: ctx.organizacaoId,
        apartamentoId: apto.id,
        inquilinoId: morador.id,
        fiadorId,
        dataInicio: paraDataCalendario(d.dataInicio),
        dataFim: paraDataCalendario(d.dataFim),
        valorAluguel: d.valorAluguel,
        valorInicial: d.valorAluguel,
        diaVencimento: d.diaVencimento,
        valorCaucao: d.valorCaucao || null,
        indiceReajuste: d.indiceReajuste,
        percentualFixo: d.indiceReajuste === "FIXO" ? numeroDePercentual(d.percentualFixo) : null,
        proximoReajusteEm: d.indiceReajuste === "NENHUM" ? null : paraDataCalendario(somarMeses(d.dataInicio, 12)),
        observacoes: d.observacoes || null,
      },
      select: { id: true },
    });

    const { status } = await tx.apartamento.findUniqueOrThrow({ where: { id: apto.id }, select: { status: true } });
    if (status !== "OCUPADO") {
      await tx.apartamento.update({ where: { id: apto.id }, data: { status: "OCUPADO" } });
      await tx.historicoStatus.create({
        data: {
          organizationId: ctx.organizacaoId,
          apartamentoId: apto.id,
          de: status,
          para: "OCUPADO",
          origem: "CONTRATO",
          motivo: `Contrato com ${morador.nome}`,
          usuarioId: ctx.usuario.id,
        },
      });
    }
    return { id: contrato.id };
  });

  if ("conflito" in resultado) return falha(resultado.conflito);
  redirect(`/contratos/${resultado.id}`);
}

async function contratoAtivo(organizacaoId: string, id: string) {
  return db.contrato.findFirst({
    where: { id, organizationId: organizacaoId, status: "ATIVO" },
    include: { inquilino: { select: { nome: true, fiadores: { select: { id: true } } } }, apartamento: { select: { id: true, status: true } } },
  });
}

export async function editarContrato(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaEditarContrato.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;

  const contrato = await contratoAtivo(ctx.organizacaoId, id);
  if (!contrato) return falha("Só dá para editar contrato ativo.");
  const inicio = isoDeDataCalendario(contrato.dataInicio);
  if (d.dataFim <= inicio) {
    return falha("O término precisa ser depois do início.", { dataFim: "O término precisa ser depois do início." });
  }

  // Mudou de "sem reajuste" para um índice: o próximo reajuste é o próximo aniversário.
  const proximoReajusteEm =
    d.indiceReajuste === "NENHUM"
      ? null
      : contrato.proximoReajusteEm ?? paraDataCalendario(proximoAniversario(inicio, hojeISO()));

  await db.contrato.update({
    where: { id: contrato.id },
    data: {
      dataFim: paraDataCalendario(d.dataFim),
      valorAluguel: d.valorAluguel,
      diaVencimento: d.diaVencimento,
      valorCaucao: d.valorCaucao || null,
      indiceReajuste: d.indiceReajuste,
      percentualFixo: d.indiceReajuste === "FIXO" ? numeroDePercentual(d.percentualFixo) : null,
      proximoReajusteEm,
      fiadorId: contrato.inquilino.fiadores.some((f) => f.id === d.fiadorId) ? d.fiadorId : null,
      observacoes: d.observacoes || null,
    },
  });
  redirect(`/contratos/${contrato.id}`);
}

export async function encerrarContrato(id: string, entrada: unknown): Promise<Resultado> {
  const ctx = await exigirContexto();
  const dados = esquemaEncerrar.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);
  const d = dados.data;

  const contrato = await contratoAtivo(ctx.organizacaoId, id);
  if (!contrato) return falha("Esse contrato já foi encerrado.");
  if (d.dataSaida < isoDeDataCalendario(contrato.dataInicio)) {
    const msg = `A saída não pode ser antes do início (${formatarData(contrato.dataInicio)}).`;
    return falha(msg, { dataSaida: msg });
  }
  const caucao = contrato.valorCaucao ?? 0;
  if (d.valorCaucaoDevolvido > caucao) {
    const msg = "A devolução não pode ser maior que a caução recebida.";
    return falha(msg, { valorCaucaoDevolvido: msg });
  }

  await db.$transaction([
    db.contrato.update({
      where: { id: contrato.id },
      data: {
        status: "ENCERRADO",
        encerradoEm: paraDataCalendario(d.dataSaida),
        motivoEncerramento: d.detalhe ? `${d.motivo}: ${d.detalhe}` : d.motivo,
        proximoReajusteEm: null,
        caucaoDevolvidaEm: caucao ? paraDataCalendario(d.dataSaida) : null,
        valorCaucaoDevolvido: caucao ? d.valorCaucaoDevolvido : null,
      },
    }),
    db.apartamento.update({ where: { id: contrato.apartamento.id }, data: { status: d.statusApto } }),
    db.historicoStatus.create({
      data: {
        organizationId: ctx.organizacaoId,
        apartamentoId: contrato.apartamento.id,
        de: contrato.apartamento.status,
        para: d.statusApto,
        origem: "CONTRATO",
        motivo: `Fim do contrato com ${contrato.inquilino.nome}`,
        usuarioId: ctx.usuario.id,
      },
    }),
  ]);
  refresh();
  return sucesso();
}

export type PreviaReajuste = {
  dataBase: string;
  indice: IndiceReajuste;
  valorAtual: number;
  /** null = o índice não está disponível; a usuária digita o percentual. */
  percentual: number | null;
  periodo: string | null;
  meses: { competencia: string; variacao: number }[];
  aviso: string | null;
};

/** Calcula o reajuste do próximo aniversário (busca o índice no Banco Central se precisar). */
export async function prepararReajuste(id: string): Promise<Resultado<PreviaReajuste>> {
  const ctx = await exigirContexto();
  const contrato = await contratoAtivo(ctx.organizacaoId, id);
  if (!contrato?.proximoReajusteEm || contrato.indiceReajuste === "NENHUM") {
    return falha("Este contrato não tem reajuste previsto.");
  }

  const dataBase = isoDeDataCalendario(contrato.proximoReajusteEm);
  const base = { dataBase, indice: contrato.indiceReajuste, valorAtual: contrato.valorAluguel, meses: [] };
  if (contrato.indiceReajuste === "FIXO") {
    return sucesso({ ...base, percentual: Number(contrato.percentualFixo ?? 0), periodo: null, aviso: null });
  }

  const indice = contrato.indiceReajuste;
  const periodo = periodoDoIndice(dataBase);
  const { meses, faltando, semConexao } = await variacoesDoPeriodo(indice, periodo.inicio);
  const rotulo = INDICES[indice].rotulo;

  if (faltando.length > 0) {
    return sucesso({
      ...base,
      percentual: null,
      periodo: periodo.texto,
      meses,
      aviso: semConexao
        ? `Não consegui buscar o ${rotulo} no Banco Central agora. Digite o percentual ou tente mais tarde.`
        : `O ${rotulo} de ${mesAbreviado(faltando[0])} ainda não foi divulgado. Digite o percentual ou espere a divulgação.`,
    });
  }

  const percentual = Math.round(acumular(meses.map((m) => m.variacao)) * 10_000) / 10_000;
  return sucesso({
    ...base,
    percentual,
    periodo: periodo.texto,
    meses,
    aviso:
      percentual < 0
        ? `O ${rotulo} acumulado ficou negativo. A maioria dos contratos não reduz o aluguel nesse caso — o padrão aqui é manter o valor.`
        : null,
  });
}

export async function aplicarReajuste(id: string, entrada: unknown): Promise<Resultado<{ valorNovo: number }>> {
  const ctx = await exigirContexto();
  const dados = esquemaReajuste.safeParse(entrada);
  if (!dados.success) return falhaDeValidacao(dados.error);

  const contrato = await contratoAtivo(ctx.organizacaoId, id);
  if (!contrato?.proximoReajusteEm) return falha("Este contrato não tem reajuste previsto.");

  const percentual = dados.data.manterValor ? 0 : dados.data.percentual;
  const valorNovo = aplicarPercentual(contrato.valorAluguel, percentual);
  const dataBase = isoDeDataCalendario(contrato.proximoReajusteEm);

  await db.$transaction([
    db.reajuste.create({
      data: {
        organizationId: ctx.organizacaoId,
        contratoId: contrato.id,
        dataBase: contrato.proximoReajusteEm,
        indice: contrato.indiceReajuste,
        percentual,
        valorAnterior: contrato.valorAluguel,
        valorNovo,
        observacao: dados.data.observacao || (dados.data.manterValor ? "Valor mantido" : null),
        aplicadoPorId: ctx.usuario.id,
      },
    }),
    db.contrato.update({
      where: { id: contrato.id },
      data: { valorAluguel: valorNovo, proximoReajusteEm: paraDataCalendario(somarMeses(dataBase, 12)) },
    }),
  ]);
  refresh();
  return sucesso({ valorNovo });
}
