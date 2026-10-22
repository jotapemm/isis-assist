"use client";

import { useState } from "react";
import { Rows3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GeradorLote } from "./gerador-lote";

/** Abre o gerador em lote numa gaveta (quando o prédio já tem aptos e a pessoa quer acrescentar um andar). */
export function BotaoGerarLote({ existentes }: { existentes: string[] }) {
  const [aberto, setAberto] = useState(false);
  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Rows3 className="size-4" />
          Adicionar vários
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Adicionar vários apartamentos</SheetTitle>
          <SheetDescription>Diga quantos andares e quantos por andar. Os números saem prontos.</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">
          <GeradorLote existentes={existentes} aoConcluir={() => setAberto(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
