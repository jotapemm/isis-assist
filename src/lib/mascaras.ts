// Máscaras de digitação: recebem o que a pessoa digitou e devolvem o texto formatado.
// O banco guarda só os dígitos (somenteDigitos).

export function somenteDigitos(texto: string) {
  return texto.replace(/\D/g, "");
}

/** Aplica um molde onde cada "0" é um dígito: aplicarMolde("12345", "000.000") → "123.45". */
function aplicarMolde(digitos: string, molde: string) {
  let saida = "";
  let i = 0;
  for (const c of molde) {
    if (i >= digitos.length) break;
    if (c === "0") saida += digitos[i++];
    else saida += c;
  }
  return saida;
}

export function mascararCPF(texto: string) {
  return aplicarMolde(somenteDigitos(texto).slice(0, 11), "000.000.000-00");
}

export function mascararCNPJ(texto: string) {
  return aplicarMolde(somenteDigitos(texto).slice(0, 14), "00.000.000/0000-00");
}

/** Até 11 dígitos é CPF; daí em diante vira CNPJ. */
export function mascararCpfCnpj(texto: string) {
  const d = somenteDigitos(texto);
  return d.length <= 11 ? mascararCPF(d) : mascararCNPJ(d);
}

/** Fixo (00) 0000-0000 ou celular (00) 00000-0000. */
export function mascararTelefone(texto: string) {
  const d = somenteDigitos(texto).slice(0, 11);
  return aplicarMolde(d, d.length <= 10 ? "(00) 0000-0000" : "(00) 00000-0000");
}

export function mascararCEP(texto: string) {
  return aplicarMolde(somenteDigitos(texto).slice(0, 8), "00000-000");
}

/**
 * Campo de dinheiro "de caixa eletrônico": os dígitos entram pela direita.
 * Digitar 1, 5, 0, 0, 0, 0 → 1.500,00. Devolve centavos inteiros.
 */
export function centavosDeDigitos(texto: string) {
  const d = somenteDigitos(texto).replace(/^0+/, "").slice(0, 11);
  return d ? Number(d) : 0;
}
