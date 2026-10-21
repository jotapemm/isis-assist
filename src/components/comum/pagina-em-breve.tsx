import { Suspense } from "react";
import type { LucideIcon } from "lucide-react";
import { exigirContexto } from "@/server/contexto";
import { CabecalhoPagina } from "./cabecalho-pagina";
import { EsqueletoBloco } from "./esqueleto";
import { EstadoVazio, SeloEmBreve } from "./estado-vazio";

type Props = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  oQueVem: string;
  explicacao: string;
  fase: string;
};

/**
 * Tela de módulo ainda não construído. O cabeçalho é estático (aparece na hora ao navegar);
 * o conteúdo passa pela checagem de login, atrás de um <Suspense>.
 */
export function PaginaEmBreve({ titulo, descricao, ...resto }: Props) {
  return (
    <>
      <CabecalhoPagina titulo={titulo} descricao={descricao} />
      <Suspense fallback={<EsqueletoBloco />}>
        <Conteudo {...resto} />
      </Suspense>
    </>
  );
}

async function Conteudo({ icone, oQueVem, explicacao, fase }: Omit<Props, "titulo" | "descricao">) {
  await exigirContexto();
  return (
    <EstadoVazio icone={icone} titulo={oQueVem} descricao={explicacao}>
      <SeloEmBreve fase={fase} />
    </EstadoVazio>
  );
}
