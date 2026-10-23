// As palavras do app seguem o tipo do residencial: prédio de apartamentos ou casas.
// O código e as rotas continuam dizendo "apartamento"; só o que a usuária lê muda.

export const TIPOS_RESIDENCIAL = ["EDIFICIO", "CASAS"] as const;
export type TipoResidencial = (typeof TIPOS_RESIDENCIAL)[number];

export const DESCRICAO_TIPO: Record<TipoResidencial, { rotulo: string; explicacao: string }> = {
  EDIFICIO: { rotulo: "Prédio de apartamentos", explicacao: "Unidades em andares: 101, 102, 201…" },
  CASAS: { rotulo: "Residencial de casas", explicacao: "Casas numeradas em sequência: Casa 01, 02, 03…" },
};

const BASE = {
  EDIFICIO: { singular: "apartamento", plural: "apartamentos", curto: "Apto", menu: "Aptos", feminino: false },
  CASAS: { singular: "casa", plural: "casas", curto: "Casa", menu: "Casas", feminino: true },
} as const;

const maiuscula = (texto: string) => texto[0].toUpperCase() + texto.slice(1);

/**
 * Palavras prontas, já concordando em gênero. Ex.: `${v.nenhum} ${v.singular} ${v.cadastrado}` vira
 * "Nenhum apartamento cadastrado" ou "Nenhuma casa cadastrada".
 * É uma função pura (e não um objeto passado do servidor) porque `nome` é função: o componente do
 * navegador recebe só o `tipo` e monta o vocabulário de lá.
 */
export function vocabulario(tipo: TipoResidencial = "EDIFICIO") {
  const { feminino, ...base } = BASE[tipo];
  const ou = (masculino: string, femininoTexto: string) => (feminino ? femininoTexto : masculino);
  return {
    tipo,
    ...base,
    Singular: maiuscula(base.singular),
    Plural: maiuscula(base.plural),
    o: ou("o", "a"),
    um: ou("um", "uma"),
    num: ou("num", "numa"),
    no: ou("no", "na"),
    do: ou("do", "da"),
    este: ou("este", "esta"),
    novo: ou("Novo", "Nova"),
    nenhum: ou("Nenhum", "Nenhuma"),
    cadastrado: ou("cadastrado", "cadastrada"),
    cadastrados: ou("cadastrados", "cadastradas"),
    ocupados: ou("ocupados", "ocupadas"),
    alugados: ou("alugados", "alugadas"),
    todos: ou("todos", "todas"),
    esses: ou("esses", "essas"),
    novos: ou("novos", "novas"),
    osOutros: ou("os outros", "as outras"),
    cadaUm: ou("cada um", "cada uma"),
    criados: ou("criados", "criadas"),
    /** "Apto 203" / "Casa 01" */
    nome: (identificacao: string) => `${base.curto} ${identificacao}`,
    /** "apto 203" / "casa 01" — no meio da frase. */
    nomeMinusculo: (identificacao: string) => `${base.curto.toLowerCase()} ${identificacao}`,
  };
}

export type Vocabulario = ReturnType<typeof vocabulario>;
