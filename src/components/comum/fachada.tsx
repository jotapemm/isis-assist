import { cn } from "@/lib/utils";

type Janela = "ocupado" | "livre" | "reservado" | "reforma" | "manutencao" | "apagada";

const PREENCHIMENTO: Record<Janela, string> = {
  ocupado: "fill-ocupado",
  livre: "fill-livre",
  reservado: "fill-reservado",
  reforma: "fill-reforma",
  manutencao: "fill-manutencao",
  apagada: "fill-muted",
};

// Andares de cima para baixo, como se vê a fachada.
const DEMONSTRACAO: Janela[][] = [
  ["ocupado", "ocupado", "livre", "ocupado"],
  ["reservado", "ocupado", "ocupado", "manutencao"],
  ["ocupado", "reforma", "ocupado", "ocupado"],
];

/**
 * A fachada do residencial — o elemento-assinatura do Isis-Assist. Cada janela é um apartamento,
 * colorida pelo status. Aqui é ilustrativa (telas de acesso e estados vazios); o mapa interativo
 * do painel usa a mesma linguagem.
 */
export function Fachada({
  andares = DEMONSTRACAO,
  apagada = false,
  className,
}: {
  andares?: Janela[][];
  apagada?: boolean;
  className?: string;
}) {
  const largura = 240;
  const alturaAndar = 58;
  const topo = 46;
  const terreo = topo + andares.length * alturaAndar;
  const altura = terreo + 66;

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className={cn("h-auto w-full", className)} aria-hidden="true">
      {/* laje */}
      <rect x="8" y="24" width={largura - 16} height="16" rx="5" className="fill-secondary" />
      {/* corpo */}
      <rect x="20" y="36" width={largura - 40} height={altura - 44} rx="6" className="fill-card stroke-border" strokeWidth="1.5" />

      {andares.map((janelas, a) =>
        janelas.map((status, j) => {
          const x = 38 + j * 44;
          const y = topo + a * alturaAndar;
          const cor = apagada ? "apagada" : status;
          return (
            <g key={`${a}-${j}`}>
              <rect x={x} y={y} width="32" height="40" rx="5" className={PREENCHIMENTO[cor]} opacity={cor === "apagada" ? 1 : 0.92} />
              <path d={`M${x + 16} ${y + 4}v32M${x + 4} ${y + 20}h24`} className="stroke-card" strokeWidth="1.5" opacity="0.55" />
              {/* peitoril */}
              <rect x={x - 3} y={y + 41} width="38" height="3" rx="1.5" className="fill-border" />
            </g>
          );
        }),
      )}

      {/* térreo: porta em arco de latão e placa */}
      <rect x="20" y={terreo + 2} width={largura - 40} height="2" className="fill-border" />
      <path d={`M104 ${altura - 8}v-30a16 16 0 0 1 32 0v30z`} className="fill-latao" />
      <circle cx="128" cy={altura - 24} r="1.8" className="fill-card" />
      <rect x="40" y={terreo + 18} width="44" height="14" rx="3" className="fill-latao-suave stroke-latao" strokeWidth="1" />
      <rect x="156" y={terreo + 18} width="44" height="14" rx="3" className="fill-latao-suave stroke-latao" strokeWidth="1" />
      <rect x="12" y={altura - 8} width={largura - 24} height="4" rx="2" className="fill-secondary" />
    </svg>
  );
}
