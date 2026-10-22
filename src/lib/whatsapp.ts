import { somenteDigitos } from "./mascaras";

/**
 * Link que abre a conversa no WhatsApp da própria usuária, com a mensagem já escrita.
 * No v2 as cobranças automáticas vão por API; este link continua para as conversas avulsas.
 */
export function linkWhatsApp(telefone: string, mensagem?: string) {
  let numero = somenteDigitos(telefone);
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
  if (numero.length < 12) return null;
  return `https://wa.me/${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}

export function linkTelefone(telefone: string) {
  const numero = somenteDigitos(telefone);
  return numero.length >= 10 ? `tel:+55${numero.slice(-11)}` : null;
}
