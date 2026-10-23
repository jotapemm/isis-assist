import "server-only";
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatarData, formatarMoeda } from "@/lib/formatar";
import { mascararCpfCnpj } from "@/lib/mascaras";
import { competenciaDe, FORMAS, type FormaPagamento, mesPorExtenso, nomeDoMes, porExtenso } from "@/modulos/financeiro/regras";

export type DadosRecibo = {
  numero: number;
  dataPagamento: string;
  valorPago: number;
  valorPrincipal: number;
  multa: number;
  juros: number;
  forma: FormaPagamento;
  competencia: string;
  /** "apto 101" / "casa 01" */
  imovel: string;
  inquilino: { nome: string; cpf: string | null };
  locador: { nome: string; documento: string | null };
  residencial: { nome: string; endereco: string | null; cidade: string | null };
  emitidoEm: string;
};

const LAPIS = "#2c3fa3";
const TINTA = "#171b33";
const CINZA = "#5b6280";

// Helvetica (embutida no PDF) cobre os acentos do português; nada para baixar.
const e = StyleSheet.create({
  pagina: { padding: 30, paddingBottom: 40, fontFamily: "Helvetica", fontSize: 10.5, color: TINTA, lineHeight: 1.45 },
  faixa: { height: 4, backgroundColor: LAPIS, marginBottom: 14 },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  titulo: { fontFamily: "Helvetica-Bold", fontSize: 15, letterSpacing: 0.5 },
  residencial: { color: CINZA, marginTop: 2 },
  numero: { textAlign: "right", color: CINZA, marginBottom: 4 },
  caixaValor: { borderWidth: 1.5, borderColor: LAPIS, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  valor: { fontFamily: "Helvetica-Bold", fontSize: 15, color: LAPIS },
  texto: { marginBottom: 10, textAlign: "justify" },
  negrito: { fontFamily: "Helvetica-Bold" },
  tabela: { borderTopWidth: 0.5, borderTopColor: "#cfd3e3", marginBottom: 8 },
  linha: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2, borderBottomWidth: 0.5, borderBottomColor: "#e0e3ee" },
  total: { fontFamily: "Helvetica-Bold" },
  detalhe: { color: CINZA, marginBottom: 14 },
  assinatura: { alignItems: "center", marginTop: "auto" },
  localData: { textAlign: "right", marginBottom: 24 },
  traco: { width: 240, borderTopWidth: 0.8, borderTopColor: TINTA, marginBottom: 4 },
  // Fora do fluxo, na margem de baixo: o recibo com multa e juros ainda cabe na folha A5.
  rodape: { position: "absolute", bottom: 16, left: 30, right: 30, fontSize: 7.5, color: CINZA, textAlign: "center" },
});

function Recibo(d: DadosRecibo) {
  const comEncargos = d.multa + d.juros > 0;
  const local = d.residencial.cidade ? `${d.residencial.cidade.split("/")[0]}, ` : "";
  const [ano, , dia] = d.dataPagamento.split("-").map(Number);
  const dataLonga = `${dia} de ${nomeDoMes(competenciaDe(d.dataPagamento))} de ${ano}`;

  return (
    <Document title={`Recibo ${String(d.numero).padStart(4, "0")}`} author={d.locador.nome} creator="Isis-Assist" language="pt-BR">
      {/* wrap={false}: recibo é sempre uma folha só, nunca quebra em duas. */}
      <Page size="A5" orientation="landscape" wrap={false} style={e.pagina}>
        <View style={e.faixa} />
        <View style={e.topo}>
          <View>
            <Text style={e.titulo}>RECIBO DE ALUGUEL</Text>
            <Text style={e.residencial}>{d.residencial.nome}</Text>
          </View>
          <View>
            <Text style={e.numero}>Nº {String(d.numero).padStart(4, "0")}</Text>
            <View style={e.caixaValor}>
              <Text style={e.valor}>{formatarMoeda(d.valorPago)}</Text>
            </View>
          </View>
        </View>

        <Text style={e.texto}>
          Recebi de <Text style={e.negrito}>{d.inquilino.nome}</Text>
          {d.inquilino.cpf ? ` (CPF ${mascararCpfCnpj(d.inquilino.cpf)})` : ""} a quantia de{" "}
          <Text style={e.negrito}>{formatarMoeda(d.valorPago)}</Text> ({porExtenso(d.valorPago)}), referente ao aluguel de{" "}
          <Text style={e.negrito}>{mesPorExtenso(d.competencia)}</Text> do <Text style={e.negrito}>{d.imovel}</Text> do{" "}
          {d.residencial.nome}
          {d.residencial.endereco ? `, ${d.residencial.endereco}` : ""}.
        </Text>

        {comEncargos && (
          <View style={e.tabela}>
            <View style={e.linha}>
              <Text>Aluguel</Text>
              <Text>{formatarMoeda(d.valorPrincipal)}</Text>
            </View>
            {d.multa > 0 && (
              <View style={e.linha}>
                <Text>Multa por atraso</Text>
                <Text>{formatarMoeda(d.multa)}</Text>
              </View>
            )}
            {d.juros > 0 && (
              <View style={e.linha}>
                <Text>Juros</Text>
                <Text>{formatarMoeda(d.juros)}</Text>
              </View>
            )}
            <View style={e.linha}>
              <Text style={e.total}>Total</Text>
              <Text style={e.total}>{formatarMoeda(d.valorPago)}</Text>
            </View>
          </View>
        )}

        <Text style={e.detalhe}>
          Forma de pagamento: {FORMAS[d.forma]} · Pago em {formatarData(d.dataPagamento)}
        </Text>

        <View style={e.assinatura}>
          <Text style={e.localData}>
            {local}
            {dataLonga}
          </Text>
          <View style={e.traco} />
          <Text style={e.negrito}>{d.locador.nome}</Text>
          {d.locador.documento && <Text style={{ color: CINZA }}>{mascararCpfCnpj(d.locador.documento)}</Text>}
        </View>

        <Text style={e.rodape}>Emitido pelo Isis-Assist em {formatarData(d.emitidoEm)}.</Text>
      </Page>
    </Document>
  );
}

export function gerarReciboPdf(dados: DadosRecibo) {
  return renderToBuffer(<Recibo {...dados} />);
}
