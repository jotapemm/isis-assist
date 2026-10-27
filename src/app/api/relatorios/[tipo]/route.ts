import { informeDeIR, relatorioDoAno, relatorioDoMes } from "@/modulos/relatorios/consultas";
import { obterContexto } from "@/server/contexto";
import { excelDoAno, excelDoIR, excelDoMes } from "@/server/excel/relatorios";
import { pdfDoAno, pdfDoIR, pdfDoMes } from "@/server/pdf/relatorios";

const TIPOS = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
} as const;

/**
 * Relatórios em PDF ou Excel: /api/relatorios/mensal?periodo=2026-10, /anual?periodo=2026 e
 * /ir?periodo=2026, com &formato=xlsx para a planilha (o padrão é PDF).
 */
export async function GET(request: Request, { params }: RouteContext<"/api/relatorios/[tipo]">) {
  const ctx = await obterContexto();
  if (!ctx) return new Response("Entre na sua conta para baixar o relatório.", { status: 401 });

  const { tipo } = await params;
  const busca = new URL(request.url).searchParams;
  const formato = busca.get("formato") === "xlsx" ? "xlsx" : "pdf";
  const periodo = busca.get("periodo") ?? "";
  const ano = /^\d{4}$/.test(periodo) ? Number(periodo) : null;

  let corpo: Buffer;
  let nome: string;
  if (tipo === "mensal" && /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    const r = await relatorioDoMes(ctx, `${periodo}-01`);
    corpo = formato === "pdf" ? await pdfDoMes(r) : await excelDoMes(r);
    nome = `relatorio-${periodo}`;
  } else if (tipo === "anual" && ano && ano >= 2000 && ano <= 2100) {
    const r = await relatorioDoAno(ctx, ano);
    corpo = formato === "pdf" ? await pdfDoAno(r) : await excelDoAno(r);
    nome = `relatorio-${ano}`;
  } else if (tipo === "ir" && ano && ano >= 2000 && ano <= 2100) {
    const r = await informeDeIR(ctx, ano);
    corpo = formato === "pdf" ? await pdfDoIR(r) : await excelDoIR(r);
    nome = `informe-ir-${ano}`;
  } else {
    return new Response("Relatório ou período inválido.", { status: 400 });
  }

  return new Response(new Uint8Array(corpo), {
    headers: {
      "Content-Type": TIPOS[formato],
      // PDF abre no navegador (e dá para compartilhar); planilha baixa direto.
      "Content-Disposition": `${formato === "pdf" ? "inline" : "attachment"}; filename="${nome}.${formato}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
