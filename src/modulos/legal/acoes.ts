"use server";

import { redirect } from "next/navigation";
import { exigirSessao } from "@/server/contexto";
import { db } from "@/server/db";
import { VERSAO_TERMOS } from "./versao";

/** Quem já tinha conta aceita a versão atual dos Termos e da Política (a data vem do servidor). */
export async function aceitarTermos() {
  const { user } = await exigirSessao();
  await db.user.update({ where: { id: user.id }, data: { termosVersao: VERSAO_TERMOS, termosAceitosEm: new Date() } });
  redirect("/");
}
