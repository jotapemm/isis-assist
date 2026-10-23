import { hojeISO, isoDeDataCalendario } from "@/lib/formatar";
import { vocabulario } from "@/modulos/apartamentos/vocabulario";
import { obterContexto } from "@/server/contexto";
import { db } from "@/server/db";
import { gerarReciboPdf } from "@/server/pdf/recibo";

/** PDF do recibo de um pagamento — só para a conta dona. `?baixar=1` força o download. */
export async function GET(request: Request, { params }: RouteContext<"/api/recibos/[id]">) {
  const ctx = await obterContexto();
  if (!ctx) return new Response("Entre na sua conta para ver este recibo.", { status: 401 });

  const { id } = await params;
  const p = await db.pagamento.findFirst({
    where: { id, organizationId: ctx.organizacaoId },
    include: {
      cobranca: {
        select: {
          competencia: true,
          contrato: {
            select: {
              inquilino: { select: { nome: true, cpf: true } },
              apartamento: {
                select: {
                  identificacao: true,
                  propriedade: { select: { nome: true, tipo: true, logradouro: true, numero: true, bairro: true, cidade: true, uf: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!p) return new Response("Recibo não encontrado.", { status: 404 });
  if (p.estornadoEm) return new Response("Este pagamento foi desfeito; o recibo não vale mais.", { status: 410 });

  const config = await db.configuracao.findUnique({
    where: { organizationId: ctx.organizacaoId },
    select: { locadorNome: true, locadorDocumento: true },
  });
  const { inquilino, apartamento } = p.cobranca.contrato;
  const prop = apartamento.propriedade;
  const endereco = [
    [prop.logradouro, prop.numero].filter(Boolean).join(", "),
    prop.bairro,
    [prop.cidade, prop.uf].filter(Boolean).join("/"),
  ]
    .filter(Boolean)
    .join(" — ");

  const pdf = await gerarReciboPdf({
    numero: p.numeroRecibo,
    dataPagamento: isoDeDataCalendario(p.data),
    valorPago: p.valorPago,
    valorPrincipal: p.valorPrincipal,
    multa: p.multa,
    juros: p.juros,
    forma: p.forma,
    competencia: isoDeDataCalendario(p.cobranca.competencia),
    imovel: vocabulario(prop.tipo).nomeMinusculo(apartamento.identificacao),
    inquilino,
    locador: { nome: config?.locadorNome ?? ctx.usuario.nome, documento: config?.locadorDocumento ?? null },
    residencial: { nome: prop.nome, endereco: endereco || null, cidade: prop.cidade ? `${prop.cidade}/${prop.uf ?? ""}` : null },
    emitidoEm: hojeISO(),
  });

  const nome = `recibo-${String(p.numeroRecibo).padStart(4, "0")}.pdf`;
  const baixar = new URL(request.url).searchParams.has("baixar");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
