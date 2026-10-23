"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Avatar } from "@/components/layout/menu-usuario";
import { Input } from "@/components/ui/input";
import { mascararCPF, mascararTelefone, somenteDigitos } from "@/lib/mascaras";
import type { InquilinoResumo } from "../consultas";
import { BotaoWhatsApp } from "./botoes-contato";

/** "joão" acha "João": compara sem acento e sem maiúsculas. */
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function ListaInquilinos({ inquilinos }: { inquilinos: InquilinoResumo[] }) {
  const [busca, setBusca] = useState("");
  const termo = normalizar(busca.trim());
  const digitos = somenteDigitos(busca);
  const filtrados = termo
    ? inquilinos.filter(
        (i) =>
          normalizar(i.nome).includes(termo) ||
          (digitos.length >= 3 && ((i.cpf ?? "").includes(digitos) || (i.telefone ?? "").includes(digitos))),
      )
    : inquilinos;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, CPF ou telefone"
          aria-label="Buscar inquilino"
          className="pl-9"
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="rounded-2xl border bg-card px-4 py-8 text-center text-muted-foreground">
          Ninguém encontrado com &ldquo;{busca}&rdquo;.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {filtrados.map((i) => (
            <li key={i.id} className="flex items-center gap-2 pr-3">
              <Link href={`/inquilinos/${i.id}`} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 hover:bg-muted/60">
                <Avatar nome={i.nome} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{i.nome}</span>
                  <span className="truncate text-sm text-muted-foreground tabular-nums">
                    {i.dadosApagadosEm
                      ? "Dados pessoais apagados (LGPD)"
                      : [i.telefone && mascararTelefone(i.telefone), i.cpf && `CPF ${mascararCPF(i.cpf)}`].filter(Boolean).join(" · ") ||
                        "Sem telefone nem CPF"}
                  </span>
                </span>
                <ChevronRight className="ml-auto size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
              <BotaoWhatsApp telefone={i.telefone} nome={i.nome} aceita={i.aceitaWhatsapp} compacto />
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted-foreground">
        {filtrados.length === inquilinos.length
          ? `${inquilinos.length} ${inquilinos.length === 1 ? "inquilino" : "inquilinos"}`
          : `${filtrados.length} de ${inquilinos.length}`}
      </p>
    </div>
  );
}
