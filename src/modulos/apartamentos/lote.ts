// Geração em lote: "3 andares, 4 por andar" → 101–104, 201–204, 301–304.

export type PlanoLote = {
  /** Andares acima do térreo. */
  andares: number;
  porAndar: number;
  /** Se o térreo também tem apartamentos (numerados 01, 02…). */
  comTerreo: boolean;
};

export type AptoGerado = { identificacao: string; andar: number | null };

/** Padrão brasileiro: andar seguido do número com dois dígitos (203 = 2º andar, apto 3; 01 = térreo). */
export function gerarIdentificacoes({ andares, porAndar, comTerreo }: PlanoLote): AptoGerado[] {
  const lista: AptoGerado[] = [];
  for (let andar = comTerreo ? 0 : 1; andar <= andares; andar++) {
    for (let n = 1; n <= porAndar; n++) {
      const numero = String(n).padStart(2, "0");
      lista.push({ identificacao: andar === 0 ? numero : `${andar}${numero}`, andar });
    }
  }
  return lista;
}

/** Residencial de casas: Casa 01, 02… (três dígitos a partir de 100 casas, para ordenar certo). */
export function numerarCasas(quantidade: number): AptoGerado[] {
  const digitos = Math.max(2, String(quantidade).length);
  return Array.from({ length: quantidade }, (_, i) => ({ identificacao: String(i + 1).padStart(digitos, "0"), andar: null }));
}

export const LIMITES_LOTE = { andares: 40, porAndar: 30, casas: 300 } as const;
