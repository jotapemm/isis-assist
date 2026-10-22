import { randomUUID } from "node:crypto";
import { extensao, problemaNoArquivo } from "@/modulos/arquivos/regras";
import { armazenamento } from "@/server/armazenamento";
import { obterContexto } from "@/server/contexto";
import { db } from "@/server/db";

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
  if (!(arquivo instanceof File) || (categoria !== "FOTO_APTO" && categoria !== "DOCUMENTO")) {
    return Response.json({ erro: "Envio incompleto. Tente de novo." }, { status: 400 });
  }

  const problema = problemaNoArquivo(categoria, arquivo.type, arquivo.size);
  if (problema) return Response.json({ erro: problema }, { status: 400 });

  // O dono do arquivo precisa ser desta conta.
  const donoId = String(dados.get(categoria === "FOTO_APTO" ? "apartamentoId" : "inquilinoId") ?? "");
  const dono =
    categoria === "FOTO_APTO"
      ? await db.apartamento.findFirst({ where: { id: donoId, organizationId: ctx.organizacaoId }, select: { id: true } })
      : await db.inquilino.findFirst({ where: { id: donoId, organizationId: ctx.organizacaoId }, select: { id: true } });
  if (!dono) return Response.json({ erro: "Não encontrei onde guardar este arquivo." }, { status: 404 });

  const chave = `${ctx.organizacaoId}/${categoria.toLowerCase()}/${randomUUID()}.${extensao(arquivo.type)}`;
  await armazenamento().salvar(chave, new Uint8Array(await arquivo.arrayBuffer()));

  const vinculo = categoria === "FOTO_APTO" ? { apartamentoId: dono.id } : { inquilinoId: dono.id };
  const ordem = await db.arquivo.count({ where: { organizationId: ctx.organizacaoId, categoria, ...vinculo } });
  const registro = await db.arquivo.create({
    data: {
      organizationId: ctx.organizacaoId,
      chave,
      nomeOriginal: arquivo.name.slice(0, 200) || "arquivo",
      tipoMime: arquivo.type,
      tamanhoBytes: arquivo.size,
      categoria,
      ordem,
      enviadoPorId: ctx.usuario.id,
      ...vinculo,
    },
    select: { id: true },
  });

  return Response.json({ id: registro.id }, { status: 201 });
}
