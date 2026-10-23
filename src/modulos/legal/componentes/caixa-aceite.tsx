"use client";

import Link from "next/link";

/** "Li e aceito…", com os documentos abrindo em outra aba (quem está no meio do cadastro não perde nada). */
export function CaixaAceite({ marcado, aoMudar, erro }: { marcado: boolean; aoMudar: (marcado: boolean) => void; erro?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-start gap-3 text-sm leading-snug">
        <input
          type="checkbox"
          name="aceite"
          checked={marcado}
          onChange={(e) => aoMudar(e.target.checked)}
          aria-invalid={Boolean(erro)}
          className="mt-0.5 size-5 shrink-0 accent-primary"
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-medium text-primary underline-offset-4 hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-medium text-primary underline-offset-4 hover:underline">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
