// Dados fictícios da demonstração. Nomes, CPFs e telefones são inventados (CPFs com dígito válido,
// gerados de forma determinística para o seed dar sempre o mesmo resultado).

/** Gerador pseudoaleatório com semente (mulberry32): mesmo seed → mesmos dados. */
export function sorteador(semente: number) {
  return () => {
    semente |= 0;
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sortear = sorteador(2026);
const digitos = (n: number) => Array.from({ length: n }, () => Math.floor(sortear() * 10)).join("");

export function cpfFicticio() {
  const base = digitos(9);
  const dv = (parcial: string) => {
    let soma = 0;
    for (let i = 0; i < parcial.length; i++) soma += Number(parcial[i]) * (parcial.length + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = dv(base);
  return `${base}${d1}${dv(base + d1)}`;
}

export const celularFicticio = () => `199${digitos(8)}`;

export const rgFicticio = () => {
  const d = digitos(9);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d[8]}`;
};

export type StatusSeed = "LIVRE" | "OCUPADO" | "RESERVADO" | "REFORMA" | "MANUTENCAO";

/** Residencial Isis: 3 andares × 4 aptos. Os 04 são os de 2 quartos. */
export const APARTAMENTOS: { identificacao: string; andar: number; status: StatusSeed; motivo?: string }[] = [
  { identificacao: "101", andar: 1, status: "OCUPADO" },
  { identificacao: "102", andar: 1, status: "OCUPADO" },
  { identificacao: "103", andar: 1, status: "OCUPADO" },
  { identificacao: "104", andar: 1, status: "REFORMA", motivo: "Pintura e troca do piso da cozinha" },
  { identificacao: "201", andar: 2, status: "OCUPADO" },
  { identificacao: "202", andar: 2, status: "OCUPADO" },
  { identificacao: "203", andar: 2, status: "LIVRE" },
  { identificacao: "204", andar: 2, status: "OCUPADO" },
  { identificacao: "301", andar: 3, status: "MANUTENCAO", motivo: "Vazamento no banheiro; encanador agendado" },
  { identificacao: "302", andar: 3, status: "RESERVADO", motivo: "Interessada assina o contrato na semana que vem" },
  { identificacao: "303", andar: 3, status: "OCUPADO" },
  { identificacao: "304", andar: 3, status: "OCUPADO" },
];

export const INQUILINOS = [
  { nome: "Ana Paula Ferreira", profissao: "Enfermeira", renda: 6200_00, nascimento: "1991-04-12", emergencia: ["Rosana Ferreira", "Mãe"], fiador: "José Carlos Ferreira" },
  { nome: "Carlos Eduardo Lima", profissao: "Analista de sistemas", renda: 9500_00, nascimento: "1988-09-03", emergencia: ["Mariana Lima", "Esposa"] },
  { nome: "Juliana Martins Rocha", profissao: "Professora", renda: 4800_00, nascimento: "1994-01-27", emergencia: ["Pedro Rocha", "Irmão"], fiador: "Helena Martins" },
  { nome: "Rafael Oliveira Santos", profissao: "Motorista de aplicativo", renda: 4200_00, nascimento: "1986-11-15", emergencia: ["Cláudia Santos", "Irmã"] },
  { nome: "Fernanda Costa Ribeiro", profissao: "Contadora", renda: 7300_00, nascimento: "1990-06-08", emergencia: ["Antônio Ribeiro", "Pai"] },
  { nome: "Thiago Almeida Pereira", profissao: "Técnico em eletrônica", renda: 3900_00, nascimento: "1997-02-19", emergencia: ["Sandra Almeida", "Mãe"], fiador: "Roberto Pereira" },
  { nome: "Beatriz Souza Carvalho", profissao: "Estudante de medicina", renda: 3800_00, nascimento: "2001-08-30", emergencia: ["Márcia Souza", "Mãe"], fiador: "Paulo Carvalho", semWhatsapp: true },
  { nome: "Lucas Gabriel Nunes", profissao: "Vendedor", renda: 4100_00, nascimento: "1995-12-04", emergencia: ["Débora Nunes", "Esposa"] },
  { nome: "Patrícia Gomes Barbosa", profissao: "Cabeleireira", renda: 5100_00, nascimento: "1983-03-22", emergencia: ["Felipe Barbosa", "Filho"] },
  { nome: "Marcos Vinícius Teixeira", profissao: "Engenheiro civil", renda: 8800_00, nascimento: "1985-07-17", emergencia: ["Luciana Teixeira", "Esposa"] },
] as const;

type Indice = "IGPM" | "IPCA" | "FIXO" | "NENHUM";

/**
 * Contratos da demonstração. `mesesAtras` + `ajusteDias` = início; `reajustes` = percentuais já aplicados
 * em cada aniversário (0 = valor mantido).
 */
export const CONTRATOS: {
  apto: string;
  inquilino: string;
  mesesAtras: number;
  ajusteDias?: number;
  meses: number;
  indice: Indice;
  dia: number;
  caucao: number;
  reajustes: number[];
  encerrado?: boolean;
}[] = [
  { apto: "101", inquilino: "Ana Paula Ferreira", mesesAtras: 18, meses: 30, indice: "IGPM", dia: 5, caucao: 1, reajustes: [3.92] },
  // Reajuste chegando: o aniversário é daqui a 12 dias.
  { apto: "102", inquilino: "Carlos Eduardo Lima", mesesAtras: 12, ajusteDias: 12, meses: 30, indice: "IPCA", dia: 10, caucao: 2, reajustes: [] },
  // Reajuste atrasado: o segundo aniversário passou há 5 dias e ainda não foi aplicado.
  { apto: "103", inquilino: "Juliana Martins Rocha", mesesAtras: 24, ajusteDias: -5, meses: 36, indice: "IGPM", dia: 10, caucao: 0, reajustes: [4.18] },
  { apto: "201", inquilino: "Rafael Oliveira Santos", mesesAtras: 5, meses: 12, indice: "FIXO", dia: 15, caucao: 1, reajustes: [] },
  // Termina daqui a 40 dias.
  { apto: "202", inquilino: "Fernanda Costa Ribeiro", mesesAtras: 12, ajusteDias: 41, meses: 12, indice: "IGPM", dia: 5, caucao: 1, reajustes: [] },
  { apto: "204", inquilino: "Thiago Almeida Pereira", mesesAtras: 8, meses: 30, indice: "IGPM", dia: 10, caucao: 3, reajustes: [] },
  { apto: "303", inquilino: "Beatriz Souza Carvalho", mesesAtras: 2, meses: 12, indice: "IPCA", dia: 20, caucao: 1, reajustes: [] },
  { apto: "304", inquilino: "Lucas Gabriel Nunes", mesesAtras: 15, meses: 30, indice: "IGPM", dia: 10, caucao: 2, reajustes: [0] },
  // Quem morou no 203 antes: contrato de 24 meses que terminou há ~2 meses.
  { apto: "203", inquilino: "Patrícia Gomes Barbosa", mesesAtras: 26, meses: 24, indice: "IGPM", dia: 10, caucao: 1, reajustes: [5.06], encerrado: true },
];

export const emailFicticio = (nome: string) =>
  `${nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(" ")
    .filter((_, i, partes) => i === 0 || i === partes.length - 1)
    .join(".")}@exemplo.com.br`;

type Categoria = "IPTU" | "AGUA" | "LUZ" | "MANUTENCAO" | "SEGURO";

/** Contas que chegam todo mês, com o valor variando dentro da faixa. */
export const DESPESAS_MENSAIS: { categoria: Categoria; descricao: string; dia: number; faixa: [number, number] }[] = [
  { categoria: "LUZ", descricao: "Energia das áreas comuns", dia: 15, faixa: [180_00, 260_00] },
  { categoria: "AGUA", descricao: "Água e esgoto (relógio geral)", dia: 12, faixa: [420_00, 570_00] },
];

/** Gastos avulsos dos últimos 12 meses; `apto` = despesa daquele imóvel (sem ele, é do residencial). */
export const DESPESAS_AVULSAS: { mesesAtras: number; dia: number; categoria: Categoria; descricao: string; valor: number; apto?: string; observacao?: string }[] = [
  { mesesAtras: 9, dia: 20, categoria: "SEGURO", descricao: "Seguro do prédio (anual)", valor: 1200_00, observacao: "Apólice renovada por mais 12 meses" },
  { mesesAtras: 10, dia: 6, categoria: "MANUTENCAO", descricao: "Limpeza da caixa d'água", valor: 280_00 },
  { mesesAtras: 4, dia: 6, categoria: "MANUTENCAO", descricao: "Limpeza da caixa d'água", valor: 280_00 },
  { mesesAtras: 4, dia: 22, categoria: "MANUTENCAO", descricao: "Conserto do motor do portão", valor: 350_00 },
  { mesesAtras: 2, dia: 9, categoria: "MANUTENCAO", descricao: "Troca da resistência do chuveiro", valor: 85_00, apto: "102" },
  { mesesAtras: 1, dia: 8, categoria: "MANUTENCAO", descricao: "Pintura completa", valor: 2800_00, apto: "104", observacao: "Mão de obra e tinta; a troca do piso vem depois" },
  { mesesAtras: 0, dia: 2, categoria: "MANUTENCAO", descricao: "Visita do encanador (orçamento do vazamento)", valor: 120_00, apto: "301" },
];

/** Quem faz os consertos do Residencial Isis (Fase 4). */
export const PRESTADORES: { nome: string; especialidade: string; chavePix?: string; observacoes?: string }[] = [
  { nome: "Jorge Hidráulica", especialidade: "Encanador", observacoes: "Atende sábado de manhã. Cobra a visita (R$ 120) se não fizer o serviço." },
  { nome: "Marcos Elétrica", especialidade: "Eletricista", chavePix: "marcos.eletrica@exemplo.com.br" },
  { nome: "Pinturas Silva", especialidade: "Pintor" },
  { nome: "Reformas Oliveira", especialidade: "Pedreiro", observacoes: "Faz piso e azulejo." },
  { nome: "Portões Campinas", especialidade: "Serralheiro" },
];
