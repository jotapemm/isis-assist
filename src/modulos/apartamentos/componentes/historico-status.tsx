import { ArrowRight } from "lucide-react";
import { formatarDataHora } from "@/lib/formatar";
import { cn } from "@/lib/utils";
import type { ApartamentoDetalhe } from "../consultas";
import { STATUS } from "../status";

const ORIGEM: Record<ApartamentoDetalhe["historicoStatus"][number]["origem"], string | null> = {
  MANUAL: null,
  CONTRATO: "pelo contrato",
  MANUTENCAO: "pela ordem de serviço",
  LEMBRETE: "por um lembrete",
  IMPORTACAO: "pela importação da planilha",
};

/** Linha do tempo das mudanças de status, da mais recente para a mais antiga. */
export function HistoricoStatus({ itens }: { itens: ApartamentoDetalhe["historicoStatus"] }) {
  if (itens.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma mudança registrada ainda.</p>;
  return (
    <ol className="flex flex-col">
      {itens.map((item, i) => {
        const para = STATUS[item.para];
        const quem = [item.usuario?.name.split(" ")[0], ORIGEM[item.origem]].filter(Boolean).join(" ");
        return (
          <li key={item.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < itens.length - 1 && <span className="absolute top-4 bottom-0 left-[5px] w-px bg-border" aria-hidden="true" />}
            <span className={cn("relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-card", para.ponto)} aria-hidden="true" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="flex flex-wrap items-center gap-1.5 font-medium">
                {item.de ? (
                  <>
                    <span className={STATUS[item.de].texto}>{STATUS[item.de].rotulo}</span>
                    <ArrowRight className="size-3.5 text-muted-foreground" aria-label="para" />
                    <span className={para.texto}>{para.rotulo}</span>
                  </>
                ) : (
                  <span>
                    Cadastrado como <span className={para.texto}>{para.rotulo}</span>
                  </span>
                )}
              </p>
              {item.motivo && <p className="text-sm text-pretty">{item.motivo}</p>}
              <p className="text-sm text-muted-foreground">
                {formatarDataHora(item.createdAt)}
                {quem && ` · ${quem}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
