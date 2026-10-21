import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { PaginaEmBreve } from "@/components/comum/pagina-em-breve";

export const metadata: Metadata = { title: "Importar planilha" };

export default function Pagina() {
  return (
    <PaginaEmBreve
      titulo="Importar planilha"
      descricao="Traga os dados da planilha que você já usa."
      icone={Upload}
      oQueVem="A importação vem aqui"
      explicacao="Envie o arquivo Excel ou CSV, diga qual coluna é qual e confira tudo antes de confirmar. Se algo sair errado, dá para desfazer."
      fase="Fase 7"
    />
  );
}
