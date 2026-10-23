import { randomUUID } from "node:crypto";
import { type DestinoArquivo, extensao, problemaNoArquivo } from "@/modulos/arquivos/regras";
import { armazenamento } from "@/server/armazenamento";
import { type Contexto, obterContexto } from "@/server/contexto";
import { db } from "@/server/db";

const CATEGORIAS = ["FOTO_APTO", "FOTO_OS", "DOCUMENTO", "CONTRATO_PDF", "COMPROVANTE"] as const satisfies DestinoArquivo["categoria"][];
type Categoria = (typeof CATEGORIAS)[number];

/** Cada categoria pertence a um tipo de registro; o registro precisa ser desta conta. */
async function vinculoDoDono(ctx: Contexto, categoria: Categoria, dados: FormData) {
  const conta = { organizationId: ctx.organizacaoId };
  const id = (campo: string) => String(dados.get(campo) ?? "");
  switch (categoria) {
    case "FOTO_APTO": {
      const apto = await db.apartamento.findFirst({ where: { id: id("apartamentoId"), ...conta }, select: { id: true } });
      return apto && { apartamentoId: apto.id };
    }
    case "FOTO_OS": {
      const os = await db.ordemServico.findFirst({ where: { id: id("ordemServicoId"), ...conta }, select: { id: true } });
      return os && { ordemServicoId: os.id };
    }
    case "DOCUMENTO": {
      const inquilino = await db.inquilino.findFirst({ where: { id: id("inquilinoId"), ...conta }, select: { id: true } });
      return inquilino && { inquilinoId: inquilino.id };
    }
    case "CONTRATO_PDF": {
      const contrato = await db.contrato.findFirst({ where: { id: id("contratoId"), ...conta }, select: { id: true } });
      return contrato && { contratoId: contrato.id };
    }
    case "COMPROVANTE": {
      // Comprovante de um pagamento recebido ou de uma despesa paga.
      if (dados.has("pagamentoId")) {
        const pagamento = await db.pagamento.findFirst({ where: { id: id("pagamentoId"), ...conta }, select: { id: true } });
        return pagamento && { pagamentoId: pagamento.id };
      }
      const despesa = await db.despesa.findFirst({ where: { id: id("despesaId"), ...conta }, select: { id: true } });
      return despesa && { despesaId: despesa.id };
    }
  }
}

/**
 * Envio de arquivo (multipart). Fica numa rota própria — e não numa server action — porque as
 * actions aceitam só 1 MB por padrão; e /api fica fora do proxy, que guardaria o corpo em memória.
 */
export async function POST(request: Request) {
  const ctx = await obterContexto();
  if (!ctx) return Response.json({ erro: "Sua sessão expirou. Entre de novo." }, { status: 401 });

  const dados = await request.formData();
  const arquivo = dados.get("arquivo");
  const categoria = dados.get("categoria");
  if (!(arquivo instanceof File) || !CATEGORIAS.includes(categoria as Categoria)) {
    return Response.json({ erro: "Envio incompleto. Tente de novo." }, { status: 400 });
  }
  const cat = categoria as Categoria;

  const problema = problemaNoArquivo(cat, arquivo.type, arquivo.size);
  if (problema) return Response.json({ erro: problema }, { status: 400 });

  const vinculo = await vinculoDoDono(ctx, cat, dados);
  if (!vinculo) return Response.json({ erro: "Não encontrei onde guardar este arquivo." }, { status: 404 });

  const chave = `${ctx.organizacaoId}/${cat.toLowerCase()}/${randomUUID()}.${extensao(arquivo.type)}`;
  await armazenamento().salvar(chave, new Uint8Array(await arquivo.arrayBuffer()));

  const ordem = await db.arquivo.count({ where: { organizationId: ctx.organizacaoId, categoria: cat, ...vinculo } });
  const registro = await db.arquivo.create({
    data: {
      organizationId: ctx.organizacaoId,
      chave,
      nomeOriginal: arquivo.name.slice(0, 200) || "arquivo",
      tipoMime: arquivo.type,
      tamanhoBytes: arquivo.size,
      categoria: cat,
      ordem,
      enviadoPorId: ctx.usuario.id,
      ...vinculo,
    },
    select: { id: true },
  });

  return Response.json({ id: registro.id }, { status: 201 });
}
