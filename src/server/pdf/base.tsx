import "server-only";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatarData } from "@/lib/formatar";
import { mascararCpfCnpj } from "@/lib/mascaras";
import type { Cabecalho } from "@/modulos/relatorios/consultas";

// Peças comuns dos relatórios em PDF, no mesmo visual do recibo (faixa lápis, Helvetica embutida).
export const LAPIS = "#2c3fa3";
export const TINTA = "#171b33";
export const CINZA = "#5b6280";
const LINHA = "#e0e3ee";

export const estilos = StyleSheet.create({
  pagina: { paddingTop: 30, paddingHorizontal: 32, paddingBottom: 44, fontFamily: "Helvetica", fontSize: 9, color: TINTA, lineHeight: 1.35 },
  faixa: { height: 4, backgroundColor: LAPIS, marginBottom: 14 },
  topo: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  titulo: { fontFamily: "Helvetica-Bold", fontSize: 14, letterSpacing: 0.4 },
  subtitulo: { color: CINZA, marginTop: 2, fontSize: 10 },
  quem: { textAlign: "right", color: CINZA },
  secao: { fontFamily: "Helvetica-Bold", fontSize: 11, marginTop: 14, marginBottom: 6 },
  quadros: { flexDirection: "row", gap: 8, marginBottom: 4 },
  quadro: { flex: 1, borderWidth: 0.8, borderColor: LINHA, borderRadius: 4, padding: 8 },
  quadroRotulo: { color: CINZA, fontSize: 8 },
  quadroValor: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 2 },
  linha: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: LINHA, paddingVertical: 3 },
  linhaCabecalho: { flexDirection: "row", borderBottomWidth: 0.8, borderBottomColor: CINZA, paddingVertical: 3 },
  celulaCabecalho: { fontFamily: "Helvetica-Bold", fontSize: 8, color: CINZA },
  total: { fontFamily: "Helvetica-Bold" },
  nota: { color: CINZA, fontSize: 8, marginTop: 10 },
  aviso: { backgroundColor: "#fdf3e1", borderRadius: 4, padding: 8, marginTop: 10, fontSize: 8.5 },
  rodape: { position: "absolute", bottom: 18, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: CINZA },
  vazio: { color: CINZA, paddingVertical: 4 },
});

export function CabecalhoDoRelatorio({ titulo, subtitulo, cab }: { titulo: string; subtitulo: string; cab: Cabecalho }) {
  return (
    <>
      <View style={estilos.faixa} fixed />
      <View style={estilos.topo}>
        <View>
          <Text style={estilos.titulo}>{titulo}</Text>
          <Text style={estilos.subtitulo}>{subtitulo}</Text>
        </View>
        <View>
          <Text style={estilos.quem}>{cab.residencial}</Text>
          {cab.locador.nome && <Text style={estilos.quem}>{cab.locador.nome}</Text>}
          {cab.locador.documento && <Text style={estilos.quem}>{mascararCpfCnpj(cab.locador.documento)}</Text>}
        </View>
      </View>
    </>
  );
}

export function Rodape({ cab }: { cab: Cabecalho }) {
  return (
    <View style={estilos.rodape} fixed>
      <Text>Emitido pelo Isis-Assist em {formatarData(cab.emitidoEm)}.</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );
}

export function Quadros({ itens }: { itens: [rotulo: string, valor: string][] }) {
  return (
    <View style={estilos.quadros}>
      {itens.map(([rotulo, valor]) => (
        <View key={rotulo} style={estilos.quadro}>
          <Text style={estilos.quadroRotulo}>{rotulo}</Text>
          <Text style={estilos.quadroValor}>{valor}</Text>
        </View>
      ))}
    </View>
  );
}

export type Coluna = { titulo: string; largura: number; direita?: boolean };

/** Tabela simples: o cabeçalho se repete em cada página; a última linha pode vir em negrito (total). */
export function Tabela({ colunas, linhas, total, vazio }: { colunas: Coluna[]; linhas: string[][]; total?: string[]; vazio?: string }) {
  const celula = (c: Coluna, extra?: object) => ({ width: `${c.largura}%`, textAlign: c.direita ? ("right" as const) : ("left" as const), paddingRight: 4, ...extra });
  return (
    <View>
      <View style={estilos.linhaCabecalho} fixed>
        {colunas.map((c) => (
          <Text key={c.titulo} style={[estilos.celulaCabecalho, celula(c)]}>
            {c.titulo}
          </Text>
        ))}
      </View>
      {linhas.length === 0 && vazio && <Text style={estilos.vazio}>{vazio}</Text>}
      {linhas.map((linha, i) => (
        <View key={i} style={estilos.linha} wrap={false}>
          {linha.map((valor, j) => (
            <Text key={j} style={celula(colunas[j])}>
              {valor}
            </Text>
          ))}
        </View>
      ))}
      {total && (
        <View style={estilos.linha} wrap={false}>
          {total.map((valor, j) => (
            <Text key={j} style={[estilos.total, celula(colunas[j])]}>
              {valor}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
