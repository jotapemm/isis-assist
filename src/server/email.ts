import "server-only";

type Email = { para: string; assunto: string; html: string; texto: string };

/**
 * Envia um e-mail transacional. Sem RESEND_API_KEY (desenvolvimento), só escreve no terminal —
 * assim dá para testar "esqueci a senha" copiando o link do log.
 */
export async function enviarEmail({ para, assunto, html, texto }: Email) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.info(`\n[e-mail] para ${para} — ${assunto}\n${texto}\n`);
    return;
  }

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_REMETENTE ?? "Isis-Assist <nao-responda@isis-assist.app>",
      to: para,
      subject: assunto,
      html,
      text: texto,
    }),
  });
  if (!resposta.ok) {
    throw new Error(`Falha ao enviar e-mail (${resposta.status}): ${await resposta.text()}`);
  }
}

export function emailRedefinirSenha(nome: string, url: string): Omit<Email, "para"> {
  const primeiroNome = nome.split(" ")[0];
  return {
    assunto: "Redefinir sua senha do Isis-Assist",
    texto: `Olá, ${primeiroNome}!\n\nPara criar uma nova senha, abra o link abaixo (vale por 1 hora):\n${url}\n\nSe não foi você que pediu, pode ignorar este e-mail.`,
    html: `<p>Olá, ${primeiroNome}!</p><p>Para criar uma nova senha, toque no botão abaixo. O link vale por 1 hora.</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#2c3fa3;color:#fff;border-radius:10px;text-decoration:none">Criar nova senha</a></p><p style="color:#666">Se não foi você que pediu, pode ignorar este e-mail.</p>`,
  };
}
