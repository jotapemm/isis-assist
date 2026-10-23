import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HardHat, Plus, Wrench } from "lucide-react";
import { CabecalhoPagina } from "@/components/comum/cabecalho-pagina";
import { EsqueletoBloco } from "@/components/comum/esqueleto";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { Button } from "@/components/ui/button";
import { formatarMoeda } from "@/lib/formatar";
import { vocabularioDaConta } from "@/modulos/apartamentos/consultas";
import { CartaoOrdem } from "@/modulos/manutencoes/componentes/pecas";
import { listarOrdens } from "@/modulos/manutencoes/consultas";
import { ordenarParaResolver } from "@/modulos/manutencoes/regras";
import { exigirContexto } from "@/server/contexto";

export const metadata: Metadata = { title: "Manutenções" };

export default function PaginaManutencoes() {
  return (
    <>
      <CabecalhoPagina
        titulo="Manutenções"
        descricao="Consertos do pedido até o custo final. Concluída com custo, vira despesa sozinha."
        acoes={
          <>
            <Button asChild variant="outline">
              <Link href="/manutencoes/prestadores">
                <HardHat className="size-4" />
                Prestadores
              </Link>
            </Button>
            <Button asChild>
              <Link href="/manutencoes/nova">
                <Plus className="size-4" />
                Nova ordem
              </Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<EsqueletoBloco className="h-96" />}>
        <Conteudo />
      </Suspense>
    </>
  );
}

async function Conteudo() {
  const ctx = await exigirContexto();
  const [{ hoje, ordens }, v] = await Promise.all([listarOrdens(ctx), vocabularioDaConta(ctx)]);

  if (ordens.length === 0) {
    return (
      <EstadoVazio
        icone={Wrench}
        titulo="Nenhuma ordem de serviço ainda"
        descricao="Vazamento, tomada, portão… abra uma ordem para cada conserto e acompanhe até o fim. O custo final vira despesa no Financeiro."
      >
        <Button asChild size="lg">
          <Link href="/manutencoes/nova">
            <Plus className="size-5" />
            Abrir a primeira
          </Link>
        </Button>
      </EstadoVazio>
    );
  }

  const paraResolver = ordens.filter((o) => o.status === "ABERTA").sort(ordenarParaResolver);
  const emAndamento = ordens.filter((o) => o.status === "EM_ANDAMENTO").sort(ordenarParaResolver);
  const encerradas = ordens.filter((o) => o.status === "CONCLUIDA" || o.status === "CANCELADA").slice(0, 12);
  const mes = hoje.slice(0, 7);
  const gastoNoMes = ordens
    .filter((o) => o.status === "CONCLUIDA" && o.concluidaEm?.startsWith(mes))
    .reduce((soma, o) => soma + (o.custoFinal ?? 0), 0);

  const colunas = [
    { titulo: "Para resolver", ordens: paraResolver, vazio: "Nada esperando." },
    { titulo: "Em andamento", ordens: emAndamento, vazio: "Nenhum conserto acontecendo agora." },
    { titulo: "Encerradas", ordens: encerradas, vazio: "Nenhuma encerrada ainda." },
  ];

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground">
        <strong className="text-foreground tabular-nums">{paraResolver.length + emAndamento.length}</strong> em aberto ·{" "}
        <strong className="text-foreground tabular-nums">{formatarMoeda(gastoNoMes)}</strong> gastos com consertos neste mês
      </p>
      {/* No celular, uma coluna depois da outra; no computador, lado a lado (como um quadro). */}
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-4">
        {colunas.map((c) => (
          <section key={c.titulo} aria-label={c.titulo} className="flex flex-col gap-3">
            <h2 className="flex items-baseline gap-2 font-heading text-lg">
              {c.titulo} <span className="text-sm text-muted-foreground tabular-nums">{c.ordens.length}</span>
            </h2>
            {c.ordens.length === 0 ? (
              <p className="rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{c.vazio}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {c.ordens.map((os) => (
                  <li key={os.id}>
                    <CartaoOrdem os={os} v={v} hoje={hoje} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
