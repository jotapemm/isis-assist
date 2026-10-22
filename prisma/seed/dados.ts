// Dados fictícios da demonstração. Nomes, CPFs e telefones são inventados (CPFs com dígito válido,
// gerados de forma determinística para o seed dar sempre o mesmo resultado).

/** Gerador pseudoaleatório com semente (mulberry32): mesmo seed → mesmos dados. */
function sorteador(semente: number) {
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
  { nome: "Beatriz Souza Carvalho", profissao: "Estudante de medicina", renda: 3800_00, nascimento: "2001-08-30", emergencia: ["Márcia Souza", "Mãe"], fiador: "Paulo Carvalho" },
  { nome: "Lucas Gabriel Nunes", profissao: "Vendedor", renda: 4100_00, nascimento: "1995-12-04", emergencia: ["Débora Nunes", "Esposa"] },
  { nome: "Patrícia Gomes Barbosa", profissao: "Cabeleireira", renda: 5100_00, nascimento: "1983-03-22", emergencia: ["Felipe Barbosa", "Filho"] },
  { nome: "Marcos Vinícius Teixeira", profissao: "Engenheiro civil", renda: 8800_00, nascimento: "1985-07-17", emergencia: ["Luciana Teixeira", "Esposa"] },
] as const;

export const emailFicticio = (nome: string) =>
  `${nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(" ")
    .filter((_, i, partes) => i === 0 || i === partes.length - 1)
    .join(".")}@exemplo.com.br`;
