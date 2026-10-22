import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Onde o conteúdo dos arquivos fica guardado (o banco só tem os metadados, na tabela Arquivo).
 * Desenvolvimento: disco local. Produção: um driver S3-compatível (Supabase Storage / Cloudflare R2)
 * entra no deploy (Fase 8) implementando esta mesma interface.
 */
export interface Armazenamento {
  salvar(chave: string, conteudo: Uint8Array): Promise<void>;
  ler(chave: string): Promise<Uint8Array | null>;
  apagar(chave: string): Promise<void>;
}

function discoLocal(raiz: string): Armazenamento {
  // A chave vem sempre do servidor, mas mesmo assim nunca deixa sair da pasta raiz.
  const caminho = (chave: string) => {
    const destino = path.resolve(raiz, chave);
    if (!destino.startsWith(path.resolve(raiz) + path.sep)) throw new Error(`Chave de arquivo inválida: ${chave}`);
    return destino;
  };

  return {
    async salvar(chave, conteudo) {
      const destino = caminho(chave);
      await mkdir(path.dirname(destino), { recursive: true });
      await writeFile(destino, conteudo);
    },
    async ler(chave) {
      try {
        return await readFile(caminho(chave));
      } catch (erro) {
        if ((erro as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw erro;
      }
    },
    async apagar(chave) {
      await rm(caminho(chave), { force: true });
    },
  };
}

let instancia: Armazenamento | undefined;

export function armazenamento(): Armazenamento {
  const driver = process.env.ARMAZENAMENTO_DRIVER ?? "local";
  if (driver !== "local") throw new Error(`Driver de armazenamento "${driver}" ainda não implementado (Fase 8).`);
  instancia ??= discoLocal(process.env.ARMAZENAMENTO_DIR ?? path.join(process.cwd(), ".armazenamento"));
  return instancia;
}
