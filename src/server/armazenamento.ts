import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";

/**
 * Onde o conteúdo dos arquivos fica guardado (o banco só tem os metadados, na tabela Arquivo).
 * Desenvolvimento: disco local. Produção: S3-compatível — Supabase Storage, Cloudflare R2 ou MinIO
 * (ARMAZENAMENTO_DRIVER="s3"; passo a passo em docs/DEPLOY.md).
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

type ConfigS3 = { endpoint: string; regiao: string; bucket: string; chave: string; segredo: string };

/**
 * Endereço no estilo caminho (endpoint/bucket/chave), que é o que o Supabase Storage aceita.
 * O aws4fetch só assina o pedido (SigV4); o resto é fetch comum.
 */
function s3(c: ConfigS3): Armazenamento {
  // Poucas repetições: numa função da Vercel, esperar 10 tentativas estoura o tempo do pedido.
  const cliente = new AwsClient({ accessKeyId: c.chave, secretAccessKey: c.segredo, service: "s3", region: c.regiao, retries: 2 });
  const base = `${c.endpoint.replace(/\/+$/, "")}/${encodeURIComponent(c.bucket)}`;
  const url = (chave: string) => {
    const partes = chave.split("/");
    if (partes.some((p) => p === "" || p === "." || p === "..")) throw new Error(`Chave de arquivo inválida: ${chave}`);
    return `${base}/${partes.map(encodeURIComponent).join("/")}`;
  };
  const falha = async (acao: string, chave: string, resposta: Response) =>
    new Error(`Armazenamento S3: ${acao} "${chave}" respondeu ${resposta.status}. ${(await resposta.text()).slice(0, 300)}`);

  return {
    async salvar(chave, conteudo) {
      const resposta = await cliente.fetch(url(chave), {
        method: "PUT",
        body: new Uint8Array(conteudo),
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!resposta.ok) throw await falha("salvar", chave, resposta);
    },
    async ler(chave) {
      const resposta = await cliente.fetch(url(chave));
      if (resposta.status === 404) return null;
      if (!resposta.ok) throw await falha("ler", chave, resposta);
      return new Uint8Array(await resposta.arrayBuffer());
    },
    async apagar(chave) {
      const resposta = await cliente.fetch(url(chave), { method: "DELETE" });
      if (!resposta.ok && resposta.status !== 404) throw await falha("apagar", chave, resposta);
    },
  };
}

function configS3(): ConfigS3 {
  const variavel = (nome: string) => {
    const valor = process.env[`ARMAZENAMENTO_S3_${nome}`];
    if (!valor) throw new Error(`Falta a variável ARMAZENAMENTO_S3_${nome} (veja docs/DEPLOY.md).`);
    return valor;
  };
  return {
    endpoint: variavel("ENDPOINT"),
    regiao: variavel("REGIAO"),
    bucket: variavel("BUCKET"),
    chave: variavel("CHAVE"),
    segredo: variavel("SEGREDO"),
  };
}

let instancia: Armazenamento | undefined;

export function armazenamento(): Armazenamento {
  if (instancia) return instancia;
  const driver = process.env.ARMAZENAMENTO_DRIVER ?? "local";
  if (driver === "s3") {
    instancia = s3(configS3());
  } else if (driver === "local") {
    // Na Vercel o disco é só leitura: sem este aviso, o primeiro envio de foto quebraria com EROFS.
    if (process.env.VERCEL) throw new Error('Na Vercel use ARMAZENAMENTO_DRIVER="s3" (veja docs/DEPLOY.md).');
    instancia = discoLocal(process.env.ARMAZENAMENTO_DIR ?? path.join(process.cwd(), ".armazenamento"));
  } else {
    throw new Error(`ARMAZENAMENTO_DRIVER "${driver}" não existe. Use "local" ou "s3".`);
  }
  return instancia;
}

/**
 * Apaga vários objetos depois que o banco já não aponta para eles (apagar dados, excluir conta).
 * Uma falha aqui só deixa um arquivo órfão no armazenamento: registra no log e segue.
 */
export async function apagarDoArmazenamento(chaves: string[]) {
  const resultados = await Promise.allSettled(chaves.map((chave) => armazenamento().apagar(chave)));
  for (const r of resultados) if (r.status === "rejected") console.error("Arquivo não apagado do armazenamento:", r.reason);
}
