"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { BotaoSair } from "@/components/layout/menu-usuario";
import { aceitarTermos } from "../acoes";
import { CaixaAceite } from "./caixa-aceite";

export function FormAceitarTermos() {
  const [marcado, setMarcado] = useState(false);
  const [erro, setErro] = useState<string | undefined>();
  const [salvando, iniciar] = useTransition();

  return (
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        if (!marcado) {
          setErro("Para continuar, marque o aceite.");
          return;
        }
        iniciar(() => aceitarTermos());
      }}
      className="flex flex-col gap-6"
    >
      <CaixaAceite
        marcado={marcado}
        aoMudar={(m) => {
          setMarcado(m);
          setErro(undefined);
        }}
        erro={erro}
      />
      <Button type="submit" size="lg" className="w-full" disabled={salvando}>
        {salvando ? "Entrando…" : "Aceitar e continuar"}
      </Button>
      <BotaoSair />
    </form>
  );
}
