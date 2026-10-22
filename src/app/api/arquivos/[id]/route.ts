import { armazenamento } from "@/server/armazenamento";
import { obterContexto } from "@/server/contexto";
import { db } from "@/server/db";

/** Entrega um arquivo — só para quem está logado na conta dona dele. `?baixar=1` força o download. */
export async function GET(request: Request, { params }: RouteContext<"/api/arquivos/[id]">) {
  const ctx = await obterContexto();
  if (!ctx) return new Response("Entre na sua conta para ver este arquivo.", { status: 401 });

  const { id } = await params;
  const arquivo = await db.arquivo.findFirst({ where: { id, organizationId: ctx.organizacaoId } });
  if (!arquivo) return new Response("Arquivo não encontrado.", { status: 404 });

  const conteudo = await armazenamento().ler(arquivo.chave);
  if (!conteudo) return new Response("O arquivo não está mais guardado.", { status: 410 });

  const baixar = new URL(request.url).searchParams.has("baixar");
  const nome = encodeURIComponent(arquivo.nomeOriginal);
  return new Response(new Uint8Array(conteudo), {
    headers: {
      "Content-Type": arquivo.tipoMime,
      "Content-Length": String(conteudo.byteLength),
      "Content-Disposition": `${baixar ? "attachment" : "inline"}; filename*=UTF-8''${nome}`,
      // Foto de apto nunca muda de conteúdo: pode ficar no cache do aparelho (nunca em cache compartilhado).
      // Documento pessoal (RG, CPF…) e contrato não ficam guardados no aparelho depois que a pessoa sai da conta.
      "Cache-Control": arquivo.categoria === "FOTO_APTO" ? "private, max-age=31536000, immutable" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
