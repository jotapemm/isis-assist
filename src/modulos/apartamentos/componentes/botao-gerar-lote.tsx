"use client";

import { useState } from "react";
import { Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GeradorLote } from "./gerador-lote";
import { type TipoResidencial, vocabulario } from "../vocabulario";

/** Abre o gerador em lote numa gaveta (quando o prédio já tem aptos e a pessoa quer acrescentar um andar). */
export function BotaoGerarLote({ tipo, existentes }: { tipo: TipoResidencial; existentes: string[] }) {
  const [aberto, setAberto] = useState(false);
  const v = vocabulario(tipo);
  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Rows3 className="size-4" />
          Adicionar vári{v.o === "a" ? "as" : "os"}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Adicionar vári{v.o === "a" ? "as" : "os"} {v.plural}</SheetTitle>
          <SheetDescription>
            {tipo === "CASAS" ? "Diga quantas casas são. " : "Diga quantos andares e quantos por andar. "}Os números saem prontos.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">
          <GeradorLote tipo={tipo} existentes={existentes} aoConcluir={() => setAberto(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
