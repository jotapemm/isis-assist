"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { TipoResidencial } from "@/modulos/apartamentos/vocabulario";

const CHAVE = "isis:tipo-residencial";

function lerLembrado(): TipoResidencial | null {
  try {
    return localStorage.getItem(CHAVE) === "CASAS" ? "CASAS" : localStorage.getItem(CHAVE) === "EDIFICIO" ? "EDIFICIO" : null;
  } catch {
    return null;
  }
}

/**
 * Tipo do residencial para o menu. O menu aparece antes dos dados da conta (moldura estática), então
 * usa o último tipo lembrado neste aparelho; quando o tipo verdadeiro chega do servidor, vale ele e fica lembrado.
 */
export function useTipoResidencial(tipoDoServidor: TipoResidencial | null): TipoResidencial {
  const lembrado = useSyncExternalStore(() => () => {}, lerLembrado, () => null);
  useEffect(() => {
    if (!tipoDoServidor) return;
    try {
      localStorage.setItem(CHAVE, tipoDoServidor);
    } catch {}
  }, [tipoDoServidor]);
  return tipoDoServidor ?? lembrado ?? "EDIFICIO";
}
