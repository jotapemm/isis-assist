// Quem oferece o Isis-Assist e por onde os titulares falam sobre privacidade. Preencha no deploy
// (docs/DEPLOY.md): a LGPD pede um canal de contato mesmo de quem dispensa o encarregado (Res. ANPD 2/2022).

/** Nome da empresa (ou pessoa) que oferece o Isis-Assist, como deve aparecer nos Termos. */
export const RESPONSAVEL = process.env.NEXT_PUBLIC_RESPONSAVEL ?? "Isis-Assist";

/** E-mail do canal de privacidade. Sem ele, as páginas pedem para usar o atendimento. */
export const CONTATO_PRIVACIDADE = process.env.NEXT_PUBLIC_CONTATO_PRIVACIDADE ?? null;
