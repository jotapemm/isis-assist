"use client";

import { useState, useTransition } from "react";
import { FileImage, FileText, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatarData } from "@/lib/formatar";
import { apagarArquivo } from "@/modulos/arquivos/acoes";
import { MB, REGRAS } from "@/modulos/arquivos/regras";
import { useEnvioArquivos } from "@/modulos/arquivos/use-envio";
import type { InquilinoDetalhe } from "../consultas";

type Documento = InquilinoDetalhe["arquivos"][number];

const tamanho = (bytes: number) =>
  bytes >= MB ? `${(bytes / MB).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** RG, CPF, comprovante de renda, de residência… Abre num toque; apagar pede confirmação na própria linha. */
export function Documentos({ inquilinoId, documentos }: { inquilinoId: string; documentos: Documento[] }) {
  const { enviar, enviando } = useEnvioArquivos({ categoria: "DOCUMENTO", inquilinoId });
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [apagando, iniciar] = useTransition();

  function apagar(id: string) {
    iniciar(async () => {
      const r = await apagarArquivo(id);
      if (r.ok) toast.success("Documento apagado.");
      else toast.error(r.erro);
      setConfirmando(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {documentos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum documento ainda. Dá para tirar foto do RG ou anexar um PDF.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {documentos.map((doc) => {
            const Icone = doc.tipoMime === "application/pdf" ? FileText : FileImage;
            return (
              <li key={doc.id} className="flex items-center gap-3 px-3 py-2.5">
                <Icone className="size-5 shrink-0 text-primary" aria-hidden="true" />
                <a
                  href={`/api/arquivos/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 flex-col hover:underline"
                >
                  <span className="truncate text-sm font-medium">{doc.nomeOriginal}</span>
                  <span className="text-xs text-muted-foreground">
                    {tamanho(doc.tamanhoBytes)} · enviado em {formatarData(doc.createdAt)}
                  </span>
                </a>
                {confirmando === doc.id ? (
                  <span className="flex shrink-0 items-center gap-1">
                    <Button size="sm" variant="destructive" disabled={apagando} onClick={() => apagar(doc.id)}>
                      Apagar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmando(null)}>
                      Não
                    </Button>
                  </span>
                ) : (
                  <Button size="icon-sm" variant="ghost" aria-label={`Apagar ${doc.nomeOriginal}`} onClick={() => setConfirmando(doc.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-lg border border-input bg-background px-4 text-[0.95rem] font-medium hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50 md:h-10">
        <Paperclip className="size-4" aria-hidden="true" />
        {enviando ? `Enviando ${enviando.atual} de ${enviando.total}…` : "Anexar documento"}
        <input
          type="file"
          accept={REGRAS.DOCUMENTO.aceitar}
          multiple
          className="sr-only"
          disabled={Boolean(enviando)}
          onChange={(e) => {
            const arquivos = e.target.files;
            if (arquivos) void enviar(arquivos);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
