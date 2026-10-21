import {
  Building2,
  CalendarCheck,
  FileSignature,
  Home,
  type LucideIcon,
  Settings,
  Upload,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export type ItemNavegacao = { href: string; rotulo: string; icone: LucideIcon; curto?: string };

/** Ordem da barra lateral (desktop). */
export const NAVEGACAO: ItemNavegacao[] = [
  { href: "/", rotulo: "Início", icone: Home },
  { href: "/apartamentos", rotulo: "Apartamentos", icone: Building2, curto: "Aptos" },
  { href: "/inquilinos", rotulo: "Inquilinos", icone: Users },
  { href: "/contratos", rotulo: "Contratos", icone: FileSignature },
  { href: "/financeiro", rotulo: "Financeiro", icone: Wallet },
  { href: "/manutencoes", rotulo: "Manutenções", icone: Wrench },
  { href: "/lembretes", rotulo: "Lembretes", icone: CalendarCheck },
];

export const NAVEGACAO_SECUNDARIA: ItemNavegacao[] = [
  { href: "/importar", rotulo: "Importar planilha", icone: Upload },
  { href: "/configuracoes", rotulo: "Configurações", icone: Settings },
];

/** Os quatro atalhos fixos do menu inferior (celular); o resto fica em "Mais". */
export const MENU_INFERIOR = ["/", "/apartamentos", "/financeiro", "/lembretes"];

export function estaAtivo(href: string, caminho: string) {
  return href === "/" ? caminho === "/" : caminho === href || caminho.startsWith(`${href}/`);
}
