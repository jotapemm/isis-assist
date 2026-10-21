import { Skeleton } from "@/components/ui/skeleton";
import { obterResumoConta } from "@/modulos/conta/consultas";
import { exigirContexto } from "@/server/contexto";
import { MenuUsuario } from "./menu-usuario";

/** Lê a sessão — por isso sempre fica dentro de um <Suspense> (Cache Components). */
export async function UsuarioAtual({ compacto = false }: { compacto?: boolean }) {
  const ctx = await exigirContexto();
  const { propriedade } = await obterResumoConta(ctx);
  return (
    <MenuUsuario
      compacto={compacto}
      usuario={{ nome: ctx.usuario.nome, email: ctx.usuario.email, residencial: propriedade?.nome ?? null }}
    />
  );
}

export function UsuarioAtualCarregando({ compacto = false }: { compacto?: boolean }) {
  return compacto ? (
    <Skeleton className="size-11 rounded-full" />
  ) : (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
