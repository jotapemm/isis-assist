import { dadosDoTitular } from "@/modulos/inquilinos/privacidade";
import { obterContexto } from "@/server/contexto";

/** LGPD (art. 18, II e V): cópia de tudo o que está guardado sobre o inquilino, em JSON, para entregar a ele. */
export async function GET(_request: Request, { params }: RouteContext<"/api/inquilinos/[id]/dados">) {
  const ctx = await obterContexto();
  if (!ctx) return new Response("Entre na sua conta para baixar estes dados.", { status: 401 });

  const { id } = await params;
  const dados = await dadosDoTitular(ctx, id);
  if (!dados) return new Response("Inquilino não encontrado.", { status: 404 });

  const nome = dados.titular.nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return new Response(JSON.stringify(dados, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dados-${nome || "inquilino"}-${dados.geradoEm.slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
