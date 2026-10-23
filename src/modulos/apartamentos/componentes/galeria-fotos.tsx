"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { apagarArquivo, definirCapa } from "@/modulos/arquivos/acoes";
import { REGRAS } from "@/modulos/arquivos/regras";
import { useEnvioArquivos } from "@/modulos/arquivos/use-envio";

type Foto = { id: string; nomeOriginal: string };

const url = (id: string) => `/api/arquivos/${id}`;

/** Fotos do imóvel. A primeira é a capa; tocar numa foto abre em tamanho grande. `nome` = "Apto 203" ou "Casa 01". */
export function GaleriaFotos({ apartamentoId, nome, fotos }: { apartamentoId: string; nome: string; fotos: Foto[] }) {
  const { enviar, enviando } = useEnvioArquivos({ categoria: "FOTO_APTO", apartamentoId });
  const [aberta, setAberta] = useState<Foto | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [ocupado, iniciar] = useTransition();

  function fechar() {
    setAberta(null);
    setConfirmarApagar(false);
  }

  function usarComoCapa(foto: Foto) {
    iniciar(async () => {
      const r = await definirCapa(foto.id);
      if (r.ok) toast.success("Capa trocada.");
      else toast.error(r.erro);
      fechar();
    });
  }

  function apagar(foto: Foto) {
    iniciar(async () => {
      const r = await apagarArquivo(foto.id);
      if (r.ok) toast.success("Foto apagada.");
      else toast.error(r.erro);
      fechar();
    });
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {fotos.map((foto, i) => (
          <li key={foto.id} className="relative">
            <button
              type="button"
              onClick={() => setAberta(foto)}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
              aria-label={`Abrir foto ${i + 1}: ${nome}`}
            >
              <Image src={url(foto.id)} alt="" fill unoptimized sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
            </button>
            {i === 0 && fotos.length > 1 && (
              <span className="pointer-events-none absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-semibold">
                Capa
              </span>
            )}
          </li>
        ))}

        <li>
          <label className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-card text-center text-sm font-medium text-primary transition-colors hover:bg-muted/60 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
            <ImagePlus className="size-6" aria-hidden="true" />
            {enviando ? `Enviando ${enviando.atual} de ${enviando.total}…` : fotos.length ? "Adicionar fotos" : "Adicionar a primeira foto"}
            <input
              type="file"
              accept={REGRAS.FOTO_APTO.aceitar}
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
        </li>
      </ul>

      <Dialog open={aberta !== null} onOpenChange={(abrir) => !abrir && fechar()}>
        <DialogContent className="max-w-3xl p-3 sm:p-4">
          <DialogTitle className="sr-only">Foto: {nome}</DialogTitle>
          <DialogDescription className="sr-only">Foto em tamanho grande, com opções para usar como capa ou apagar.</DialogDescription>
          {aberta && (
            <>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                <Image src={url(aberta.id)} alt={nome} fill unoptimized sizes="90vw" className="object-contain" />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                {confirmarApagar ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <span className="text-sm">Apagar esta foto de vez?</span>
                    <Button variant="destructive" disabled={ocupado} onClick={() => apagar(aberta)}>
                      Sim, apagar
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmarApagar(false)}>
                      Não
                    </Button>
                  </div>
                ) : (
                  <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmarApagar(true)}>
                    <Trash2 className="size-4" />
                    Apagar foto
                  </Button>
                )}
                {fotos[0]?.id !== aberta.id && !confirmarApagar && (
                  <Button variant="outline" disabled={ocupado} onClick={() => usarComoCapa(aberta)}>
                    <Star className="size-4" />
                    Usar como capa
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
