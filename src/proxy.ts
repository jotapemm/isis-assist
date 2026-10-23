import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Telas abertas para quem não entrou (Termos e Privacidade: lidos antes de criar a conta).
const PUBLICAS = ["/entrar", "/criar-conta", "/esqueci-a-senha", "/redefinir-senha", "/termos", "/privacidade"];

/**
 * Checagem otimista: só olha se existe o cookie de sessão, sem ir ao banco.
 * A validação de verdade acontece em exigirContexto(), perto dos dados.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const temSessao = Boolean(getSessionCookie(request));
  const publica = PUBLICAS.some((rota) => pathname === rota || pathname.startsWith(`${rota}/`));

  // O caminho inverso (logado abrindo /entrar → início) não é feito aqui: um cookie vencido
  // mandaria para o início, que mandaria de volta para /entrar, em laço.
  if (!temSessao && !publica) {
    const url = new URL("/entrar", request.url);
    if (pathname !== "/") url.searchParams.set("voltar", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Fora: API, arquivos do Next, ícones, manifesto e o service worker.
  matcher: ["/((?!api|_next/static|_next/image|icones|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|svg|ico|webp)$).*)"],
};
