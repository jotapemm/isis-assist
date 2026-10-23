// Que arquivo pode ir para onde. Compartilhado: o navegador avisa antes de enviar, o servidor confere de novo.

export const MB = 1024 * 1024;

export const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"] as const;
export const TIPOS_DOCUMENTO = [...TIPOS_IMAGEM, "application/pdf"] as const;

export type DestinoArquivo =
  | { categoria: "FOTO_APTO"; apartamentoId: string }
  | { categoria: "DOCUMENTO"; inquilinoId: string }
  | { categoria: "CONTRATO_PDF"; contratoId: string }
  | { categoria: "COMPROVANTE"; pagamentoId: string }
  | { categoria: "COMPROVANTE"; despesaId: string };

export const REGRAS = {
  FOTO_APTO: { tipos: TIPOS_IMAGEM as readonly string[], tamanhoMaximo: 8 * MB, aceitar: "image/*" },
  DOCUMENTO: { tipos: TIPOS_DOCUMENTO as readonly string[], tamanhoMaximo: 10 * MB, aceitar: "image/*,application/pdf" },
  CONTRATO_PDF: { tipos: TIPOS_DOCUMENTO as readonly string[], tamanhoMaximo: 15 * MB, aceitar: "application/pdf,image/*" },
  COMPROVANTE: { tipos: TIPOS_DOCUMENTO as readonly string[], tamanhoMaximo: 10 * MB, aceitar: "image/*,application/pdf" },
} as const;

/**
 * Na Vercel, o pedido que chega a uma função tem no máximo 4,5 MB: acima disso o envio falha antes de
 * chegar ao código, com um erro que a usuária não entenderia. Fotos já saem reduzidas do navegador
 * (~300 KB); o teto pega os PDFs. NEXT_PUBLIC_VERCEL_ENV é preenchida pela própria Vercel no build.
 */
const TETO_DA_HOSPEDAGEM = process.env.NEXT_PUBLIC_VERCEL_ENV ? 4 * MB : Infinity;

/** Frase de erro para mostrar à usuária, ou null se o arquivo pode ser enviado. */
export function problemaNoArquivo(categoria: DestinoArquivo["categoria"], tipo: string, tamanho: number) {
  const regra = REGRAS[categoria];
  if (!regra.tipos.includes(tipo)) {
    return categoria === "FOTO_APTO"
      ? "Esse arquivo não é uma foto. Envie JPG, PNG ou WebP."
      : "Envie um PDF ou uma foto (JPG, PNG ou WebP).";
  }
  const limite = Math.min(regra.tamanhoMaximo, TETO_DA_HOSPEDAGEM);
  if (tamanho > limite) return `Arquivo grande demais. O limite é ${limite / MB} MB.`;
  return null;
}

export function extensao(tipo: string) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[tipo] ?? "bin";
}
