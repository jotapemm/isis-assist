# Isis-Assist

Gestão de aluguéis residenciais — apartamentos, inquilinos, contratos, recebimentos, manutenções e lembretes —
pensada para quem administra um residencial pelo celular e quer largar as planilhas.

O plano completo (modelagem, telas, fases e preparação do v2) está em [docs/PLANO.md](docs/PLANO.md).

## Rodando na sua máquina

Requisitos: Node 24+.

```bash
npm install
cp .env.example .env        # depois gere o BETTER_AUTH_SECRET (comando no próprio arquivo)
npm run db:subir            # sobe um Postgres local do Prisma, sem Docker (portas 51214/51215)
npm run db:migrar           # cria as tabelas
npm run db:seed             # cria a conta de demonstração
npm run dev                 # http://localhost:3000
```

**Conta de demonstração:** e-mail e senha estão em `SEED_EMAIL` e `SEED_SENHA` no `.env`.
`npm run db:seed` recria essa conta do zero sempre que rodar (as outras contas não são tocadas).

**Fotos e documentos em desenvolvimento:** ficam na pasta `.armazenamento/` (fora do git). O seed apaga os da conta de demonstração.

**"Esqueci a senha" em desenvolvimento:** sem `RESEND_API_KEY`, o e-mail com o link aparece no terminal do `npm run dev`.

**Testar no celular:** o servidor de dev também responde no IP da rede (aparece como "Network" ao iniciar).
Para instalar como app (PWA) é preciso HTTPS — isso entra no deploy.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (gera o cliente Prisma antes) |
| `npm test` | Testes (Vitest) |
| `npm run typecheck` / `npm run lint` | Tipos e lint |
| `npm run db:subir` | Sobe o Postgres local do Prisma em segundo plano |
| `npm run db:migrar` | Cria/aplica migrações e gera o cliente Prisma |
| `npm run db:seed` | Recria a conta de demonstração |
| `npm run db:studio` | Abre o Prisma Studio para olhar o banco |
| `npm run icones` | Regera os ícones do PWA a partir da marca |

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind 4 · shadcn/ui (Radix) · Prisma 7 + PostgreSQL ·
Better Auth (e-mail/senha + organizações) · react-hook-form + zod · Vitest.

## Convenções do código

- **Multi-tenant:** toda tabela do domínio tem `organizationId` (a conta do proprietário). Todo acesso a dados
  passa por `exigirContexto()` ([src/server/contexto.ts](src/server/contexto.ts)) e filtra por `ctx.organizacaoId`.
- **Dinheiro em centavos** (`Int`). **Datas de calendário** em `@db.Date`, tratadas como `AAAA-MM-DD`
  ([src/lib/formatar.ts](src/lib/formatar.ts)) — evita o "dia anterior" por causa do fuso.
- **Módulos** em `src/modulos/<módulo>/`: `esquemas.ts` (zod, compartilhado navegador/servidor),
  `consultas.ts` (leituras), `acoes.ts` (server actions), `componentes/`.
- **Páginas logadas:** cabeçalho estático + a parte que lê a sessão/dados dentro de `<Suspense>`.
  É o que o Cache Components exige, e faz a troca de tela aparecer na hora.
- **Textos** da interface em português do Brasil, frases curtas, dizendo o que acontece e como resolver.
- Nomes do domínio em português; tabelas do Better Auth em inglês (são da biblioteca).
