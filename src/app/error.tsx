"use client";

import { RotateCcw } from "lucide-react";
import { Logotipo } from "@/components/marca";
import { Button } from "@/components/ui/button";

/**
 * Quando algo quebra ao carregar uma tela (ex.: banco fora do ar), aparece isto no lugar da página
 * quebrada. Fica na raiz para pegar também os erros da casca do app (menu, usuário).
 */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const desenvolvimento = process.env.NODE_ENV === "development";
  const semBanco = /ECONNREFUSED|Failed to get session|Can't reach database/i.test(`${error.message} ${String(error.cause ?? "")}`);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logotipo />
      <div className="max-w-md">
        <h1 className="font-heading text-2xl">Não foi possível carregar esta tela</h1>
        <p className="mt-2 text-muted-foreground">
          Pode ter sido uma falha rápida de conexão. Tente de novo em alguns segundos.
        </p>
        {desenvolvimento && (
          <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-left text-sm">
            {semBanco ? (
              <>
                O banco de dados local não respondeu. Rode <code className="font-mono">npm run db:subir</code> e tente de novo
                (o <code className="font-mono">npm run dev</code> já faz isso ao iniciar).
              </>
            ) : (
              <>Detalhe (só aparece em desenvolvimento): {error.message}</>
            )}
          </p>
        )}
        {error.digest && <p className="mt-3 text-xs text-muted-foreground">Código do erro: {error.digest}</p>}
      </div>
      <Button size="lg" onClick={reset}>
        <RotateCcw className="size-4" />
        Tentar de novo
      </Button>
    </main>
  );
}
