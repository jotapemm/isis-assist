import "server-only";
import { Document, Page, renderToBuffer, Text, View } from "@react-pdf/renderer";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { mascararCpfCnpj } from "@/lib/mascaras";
import { vocabulario } from "@/modulos/apartamentos/vocabulario";
import { CATEGORIAS_DESPESA, FORMAS, type FormaPagamento, mesPorExtenso } from "@/modulos/financeiro/regras";
import type { InformeDeIR, RelatorioDoAno, RelatorioDoMes } from "@/modulos/relatorios/consultas";
import { CabecalhoDoRelatorio, estilos, Quadros, Rodape, Tabela } from "./base";

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const recibo = (n: number) => String(n).padStart(4, "0");
const mesDe = (aaaaMm: string) => mesPorExtenso(`${aaaaMm.slice(0, 7)}-01`);

function DespesasPorCategoria({ itens }: { itens: { categoria: keyof typeof CATEGORIAS_DESPESA; valor: number }[] }) {
  return (
    <Tabela
      colunas={[
        { titulo: "Categoria", largura: 70 },
        { titulo: "Total", largura: 30, direita: true },
      ]}
      linhas={itens.map((c) => [CATEGORIAS_DESPESA[c.categoria], formatarMoeda(c.valor)])}
      vazio="Nenhuma despesa."
    />
  );
}

/** Relatório do mês: resumo, receitas (pela data do pagamento) e despesas. */
function RelatorioMensal({ r }: { r: RelatorioDoMes }) {
  const v = vocabulario(r.cabecalho.tipo);
  return (
    <Document title={`Relatório de ${mesPorExtenso(r.competencia)}`} creator="Isis-Assist" language="pt-BR">
      <Page size="A4" style={estilos.pagina}>
        <CabecalhoDoRelatorio titulo="RELATÓRIO DO MÊS" subtitulo={mesPorExtenso(r.competencia)} cab={r.cabecalho} />
        <Quadros
          itens={[
            ["Receitas", formatarMoeda(r.resumo.receitas)],
            ["Despesas", formatarMoeda(r.resumo.despesas)],
            ["Saldo", formatarMoeda(r.resumo.saldo)],
          ]}
        />
        <Quadros
          itens={[
            ["Aluguéis do mês previstos", formatarMoeda(r.alugueis.previsto)],
            ["Recebido desses aluguéis", formatarMoeda(r.alugueis.recebido)],
            ["Em atraso (todos os meses)", formatarMoeda(r.alugueis.emAtraso)],
          ]}
        />

        <Text style={estilos.secao}>Receitas</Text>
        <Tabela
          colunas={[
            { titulo: "Data", largura: 11 },
            { titulo: v.curto, largura: 10 },
            { titulo: "Inquilino", largura: 29 },
            { titulo: "Referente a", largura: 16 },
            { titulo: "Forma", largura: 12 },
            { titulo: "Recibo", largura: 8 },
            { titulo: "Valor", largura: 14, direita: true },
          ]}
          linhas={r.pagamentos.map((p) => [
            formatarData(p.data),
            p.imovel,
            p.inquilino.nome,
            mesDe(p.competencia),
            FORMAS[p.forma as FormaPagamento] ?? p.forma,
            recibo(p.numeroRecibo),
            formatarMoeda(p.valorPago),
          ])}
          total={["Total", "", "", "", "", "", formatarMoeda(r.resumo.receitas)]}
          vazio="Nenhum pagamento registrado no mês."
        />
        {r.resumo.encargos > 0 && (
          <Text style={estilos.nota}>
            Inclui {formatarMoeda(r.resumo.encargos)} de multa e juros por atraso (aluguel: {formatarMoeda(r.resumo.aluguel)}).
          </Text>
        )}

        <Text style={estilos.secao}>Despesas</Text>
        <Tabela
          colunas={[
            { titulo: "Data", largura: 11 },
            { titulo: "Categoria", largura: 15 },
            { titulo: "Descrição", largura: 46 },
            { titulo: v.Singular, largura: 14 },
            { titulo: "Valor", largura: 14, direita: true },
          ]}
          linhas={r.despesas.map((d) => [
            formatarData(d.data),
            CATEGORIAS_DESPESA[d.categoria],
            d.descricao,
            d.imovel ?? "Geral",
            formatarMoeda(d.valor),
          ])}
          total={["Total", "", "", "", formatarMoeda(r.resumo.despesas)]}
          vazio="Nenhuma despesa lançada no mês."
        />

        <Text style={estilos.secao}>Despesas por categoria</Text>
        <DespesasPorCategoria itens={r.porCategoria} />

        <Text style={estilos.nota}>
          Receitas pelo regime de caixa: entram no mês em que o dinheiro foi recebido, mesmo que o aluguel seja de outro mês.
        </Text>
        <Rodape cab={r.cabecalho} />
      </Page>
    </Document>
  );
}

/** Relatório do ano: mês a mês, por imóvel e por categoria. */
function RelatorioAnual({ r }: { r: RelatorioDoAno }) {
  const v = vocabulario(r.cabecalho.tipo);
  return (
    <Document title={`Relatório de ${r.ano}`} creator="Isis-Assist" language="pt-BR">
      <Page size="A4" style={estilos.pagina}>
        <CabecalhoDoRelatorio titulo="RELATÓRIO DO ANO" subtitulo={String(r.ano)} cab={r.cabecalho} />
        <Quadros
          itens={[
            ["Receitas", formatarMoeda(r.resumo.receitas)],
            ["Despesas", formatarMoeda(r.resumo.despesas)],
            ["Saldo", formatarMoeda(r.resumo.saldo)],
          ]}
        />

        <Text style={estilos.secao}>Mês a mês</Text>
        <Tabela
          colunas={[
            { titulo: "Mês", largura: 31 },
            { titulo: "Receitas", largura: 23, direita: true },
            { titulo: "Despesas", largura: 23, direita: true },
            { titulo: "Saldo", largura: 23, direita: true },
          ]}
          linhas={r.meses.map((m) => [mesDe(m.mes), formatarMoeda(m.receitas), formatarMoeda(m.despesas), formatarMoeda(m.saldo)])}
          total={["Total", formatarMoeda(r.resumo.receitas), formatarMoeda(r.resumo.despesas), formatarMoeda(r.resumo.saldo)]}
        />

        <Text style={estilos.secao}>Por {v.singular}</Text>
        <Tabela
          colunas={[
            { titulo: v.Singular, largura: 31 },
            { titulo: "Receitas", largura: 23, direita: true },
            { titulo: "Despesas", largura: 23, direita: true },
            { titulo: "Resultado", largura: 23, direita: true },
          ]}
          linhas={[
            ...r.porImovel.imoveis.map((i) => [v.nome(i.imovel), formatarMoeda(i.receitas), formatarMoeda(i.despesas), formatarMoeda(i.resultado)]),
            ...(r.porImovel.gerais > 0 ? [["Despesas gerais do residencial", "", formatarMoeda(r.porImovel.gerais), `-${formatarMoeda(r.porImovel.gerais)}`]] : []),
          ]}
          vazio="Nada lançado no ano."
        />

        <Text style={estilos.secao}>Despesas por categoria</Text>
        <DespesasPorCategoria itens={r.porCategoria} />

        <Text style={estilos.nota}>Receitas pelo regime de caixa (data em que o pagamento foi recebido).</Text>
        <Rodape cab={r.cabecalho} />
      </Page>
    </Document>
  );
}

/**
 * Informe de IR (carnê-leão): por inquilino e por mês de recebimento, com as despesas dedutíveis.
 * A matriz mês a mês vai numa página deitada, que é onde 12 colunas cabem.
 */
function InformeIR({ r }: { r: InformeDeIR }) {
  const cpf = (c: string | null) => (c ? mascararCpfCnpj(c) : "sem CPF");
  return (
    <Document title={`Informe de rendimentos de aluguel ${r.ano}`} creator="Isis-Assist" language="pt-BR">
      <Page size="A4" style={estilos.pagina}>
        <CabecalhoDoRelatorio titulo="INFORME DE ALUGUÉIS RECEBIDOS" subtitulo={`Ano-calendário ${r.ano} · para o imposto de renda`} cab={r.cabecalho} />
        <Quadros
          itens={[
            ["Aluguéis recebidos", formatarMoeda(r.totalRecebido)],
            ["Despesas dedutíveis", formatarMoeda(r.totalDedutivel)],
            ["Recebido menos dedutível", formatarMoeda(r.totalRecebido - r.totalDedutivel)],
          ]}
        />
        {r.semCpf.length > 0 && (
          <View style={estilos.aviso}>
            <Text>
              Sem CPF cadastrado: {r.semCpf.join(", ")}. O carnê-leão pede o CPF de quem pagou; complete no cadastro do inquilino.
            </Text>
          </View>
        )}

        <Text style={estilos.secao}>Por inquilino (quem pagou)</Text>
        <Tabela
          colunas={[
            { titulo: "Inquilino", largura: 36 },
            { titulo: "CPF", largura: 18 },
            { titulo: "Aluguel", largura: 16, direita: true },
            { titulo: "Multa e juros", largura: 14, direita: true },
            { titulo: "Total", largura: 16, direita: true },
          ]}
          linhas={r.inquilinos.map((p) => [p.nome, cpf(p.cpf), formatarMoeda(p.aluguel), formatarMoeda(p.encargos), formatarMoeda(p.total)])}
          total={["Total", "", "", "", formatarMoeda(r.totalRecebido)]}
          vazio="Nenhum aluguel recebido no ano."
        />

        <Text style={estilos.secao}>Mês a mês</Text>
        <Tabela
          colunas={[
            { titulo: "Mês", largura: 31 },
            { titulo: "Recebido", largura: 23, direita: true },
            { titulo: "Dedutível", largura: 23, direita: true },
            { titulo: "Diferença", largura: 23, direita: true },
          ]}
          linhas={r.meses.map((mes, i) => [
            mesDe(mes),
            formatarMoeda(r.recebidoPorMes[i]),
            formatarMoeda(r.dedutiveisPorMes[i]),
            formatarMoeda(r.recebidoPorMes[i] - r.dedutiveisPorMes[i]),
          ])}
          total={["Total", formatarMoeda(r.totalRecebido), formatarMoeda(r.totalDedutivel), formatarMoeda(r.totalRecebido - r.totalDedutivel)]}
        />

        <Text style={estilos.secao}>Despesas dedutíveis lançadas</Text>
        <Tabela
          colunas={[
            { titulo: "Data", largura: 14 },
            { titulo: "Categoria", largura: 16 },
            { titulo: "Descrição", largura: 52 },
            { titulo: "Valor", largura: 18, direita: true },
          ]}
          linhas={r.despesasDedutiveis.map((d) => [formatarData(d.data), CATEGORIAS_DESPESA[d.categoria], d.descricao, formatarMoeda(d.valor)])}
          vazio="Nenhum IPTU ou condomínio lançado no ano."
        />

        <Text style={estilos.nota}>
          Regime de caixa: cada valor entra no mês em que foi recebido. Dedutíveis considerados: IPTU e condomínio pagos pela
          proprietária. Este informe ajuda a preencher o carnê-leão e a declaração; confira com o seu contador.
        </Text>
        <Rodape cab={r.cabecalho} />
      </Page>

      <Page size="A4" orientation="landscape" style={estilos.pagina}>
        <CabecalhoDoRelatorio titulo="RECEBIDO POR MÊS E POR INQUILINO" subtitulo={`Ano-calendário ${r.ano} · valores pela data do pagamento`} cab={r.cabecalho} />
        <Tabela
          colunas={[
            { titulo: "Inquilino", largura: 16 },
            { titulo: "CPF", largura: 10 },
            ...MESES_CURTOS.map((m) => ({ titulo: m, largura: 5.5, direita: true })),
            { titulo: "Total", largura: 8, direita: true },
          ]}
          linhas={r.inquilinos.map((p) => [
            p.nome,
            cpf(p.cpf),
            ...p.meses.map((v) => (v ? formatarMoeda(v).replace("R$", "").trim() : "–")),
            formatarMoeda(p.total).replace("R$", "").trim(),
          ])}
          total={[
            "Total",
            "",
            ...r.recebidoPorMes.map((v) => (v ? formatarMoeda(v).replace("R$", "").trim() : "–")),
            formatarMoeda(r.totalRecebido).replace("R$", "").trim(),
          ]}
          vazio="Nenhum aluguel recebido no ano."
        />
        <Text style={estilos.nota}>Valores em reais.</Text>
        <Rodape cab={r.cabecalho} />
      </Page>
    </Document>
  );
}

export const pdfDoMes = (r: RelatorioDoMes) => renderToBuffer(<RelatorioMensal r={r} />);
export const pdfDoAno = (r: RelatorioDoAno) => renderToBuffer(<RelatorioAnual r={r} />);
export const pdfDoIR = (r: InformeDeIR) => renderToBuffer(<InformeIR r={r} />);
