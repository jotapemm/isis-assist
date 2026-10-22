"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { type DestinoArquivo, problemaNoArquivo, TIPOS_IMAGEM } from "./regras";

const LADO_MAXIMO = 1600;

/**
 * Foto de celular tem 4–8 MB; aqui ela é redimensionada (lado maior 1600 px) e vira JPEG antes do
 * envio — fica com ~300 KB, sobe rápido no 4G e ocupa pouco espaço. JPEG porque o Safari não gera WebP.
 */
async function comprimirImagem(arquivo: File): Promise<File> {
  try {
    const imagem = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagem.width, imagem.height));
    const largura = Math.round(imagem.width * escala);
    const altura = Math.round(imagem.height * escala);

    const tela = document.createElement("canvas");
    tela.width = largura;
    tela.height = altura;
    tela.getContext("2d")!.drawImage(imagem, 0, 0, largura, altura);
    imagem.close();

    const blob = await new Promise<Blob | null>((ok) => tela.toBlob(ok, "image/jpeg", 0.82));
    if (!blob || blob.size >= arquivo.size) return arquivo;
    const nome = arquivo.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nome, { type: "image/jpeg" });
  } catch {
    // Formato que o navegador não abre (ex.: HEIC no computador): manda como veio e o servidor decide.
    return arquivo;
  }
}

const ehImagem = (arquivo: File) =>
  (TIPOS_IMAGEM as readonly string[]).includes(arquivo.type) || arquivo.type === "image/heic" || arquivo.type === "image/heif";

/** Envia um ou mais arquivos para /api/arquivos, um de cada vez, e atualiza a tela no fim. */
export function useEnvioArquivos(destino: DestinoArquivo) {
  const router = useRouter();
  const [enviando, setEnviando] = useState<{ atual: number; total: number } | null>(null);

  async function enviar(lista: FileList | File[]) {
    const arquivos = Array.from(lista);
    if (arquivos.length === 0) return;
    let enviados = 0;

    for (const [i, original] of arquivos.entries()) {
      setEnviando({ atual: i + 1, total: arquivos.length });
      const arquivo = ehImagem(original) ? await comprimirImagem(original) : original;

      const problema = problemaNoArquivo(destino.categoria, arquivo.type, arquivo.size);
      if (problema) {
        toast.error(`${original.name}: ${problema}`);
        continue;
      }

      const corpo = new FormData();
      corpo.set("arquivo", arquivo);
      corpo.set("categoria", destino.categoria);
      if (destino.categoria === "FOTO_APTO") corpo.set("apartamentoId", destino.apartamentoId);
      else corpo.set("inquilinoId", destino.inquilinoId);

      try {
        const resposta = await fetch("/api/arquivos", { method: "POST", body: corpo });
        if (!resposta.ok) {
          const { erro } = await resposta.json().catch(() => ({ erro: "Falha no envio." }));
          toast.error(`${original.name}: ${erro}`);
          continue;
        }
        enviados++;
      } catch {
        toast.error(`${original.name}: sem conexão. Tente de novo quando a internet voltar.`);
      }
    }

    setEnviando(null);
    if (enviados > 0) {
      toast.success(enviados === 1 ? "Arquivo enviado." : `${enviados} arquivos enviados.`);
      router.refresh();
    }
  }

  return { enviar, enviando };
}
