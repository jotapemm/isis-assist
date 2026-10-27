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

**Índices de reajuste:** IGP-M e IPCA vêm da API pública do Banco Central (SGS) na hora de aplicar o reajuste e ficam guardados no banco. Sem internet, a tela pede o percentual à mão.

**Banco fora do ar ("ECONNREFUSED" / "Failed to get session"):** o Postgres local do Prisma não volta sozinho
quando o computador reinicia. O `npm run dev` tenta subir o banco antes de começar, e também remove as travas
que um desligamento deixa para trás (sem isso o banco subia vazio). Se ainda assim der erro, rode `npm run db:subir`.

**Publicar (Vercel + Supabase):** passo a passo em [docs/DEPLOY.md](docs/DEPLOY.md).

**Manutenções:** ordens de serviço numeradas (OS 0001…) com fotos e prestadores. Imóvel vazio pode ir para
Manutenção ao abrir a ordem e voltar ao status de antes ao concluir; concluída com custo, a despesa entra sozinha
no Financeiro ([src/modulos/manutencoes/](src/modulos/manutencoes/)).

**Lembretes:** lista (atrasados, hoje, próximos 7 dias, depois, anotações, concluídos) e calendário mensal com os
vencimentos de aluguel, reajustes e fins de contrato. Os que repetem (semana, mês, ano) geram a próxima ocorrência ao
concluir; títulos com palavras de conserto sugerem abrir uma ordem de serviço ([src/modulos/lembretes/](src/modulos/lembretes/)).

**Relatórios:** em Financeiro → Relatórios e IR: mês, ano e informe de IR (carnê-leão), em PDF e Excel, pela rota
`/api/relatorios/<mensal|anual|ir>?periodo=…&formato=pdf|xlsx`. Receitas pelo regime de caixa (data do pagamento);
as contas ficam em [src/modulos/relatorios/regras.ts](src/modulos/relatorios/regras.ts).

**LGPD:** cadastro com aceite dos Termos e da Política de Privacidade (`/termos`, `/privacidade`); cada inquilino
tem "Baixar os dados" (JSON) e "Apagar dados pessoais" no menu ⋯ (nome e CPF ficam até o fim do prazo do imposto
de renda e a rotina diária apaga depois — [src/modulos/inquilinos/privacidade.ts](src/modulos/inquilinos/privacidade.ts));
"Excluir minha conta" em Configurações; botões de WhatsApp só para quem aceitou.

**Financeiro:** as cobranças do mês aparecem sozinhas para os contratos ativos (ao abrir as telas ou pela rotina
diária `GET /api/cron/diario`, protegida pelo `CRON_SECRET`). Recibos em PDF saem em `/api/recibos/<pagamento>`.

**"Esqueci a senha" em desenvolvimento:** sem `RESEND_API_KEY`, o e-mail com o link aparece no terminal do `npm run dev`.

**Testar no celular:** o servidor de dev também responde no IP da rede (aparece como "Network" ao iniciar).
Para instalar como app (PWA) é preciso HTTPS — isso entra no deploy.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o banco local se precisar e inicia o servidor de desenvolvimento |
| `npm run build` | Build de produção (gera o cliente Prisma antes) |
| `npm test` | Testes (Vitest) |
| `npm run typecheck` / `npm run lint` | Tipos e lint |
| `npm run db:subir` | Sobe o Postgres local do Prisma em segundo plano (se já estiver no ar, só avisa) |
| `npm run db:migrar` | Aplica migrações e gera o cliente Prisma. Para criar uma nova: `npx prisma migrate dev --name nome` e depois `npx prisma generate` |
| `npm run db:seed` | Recria a conta de demonstração |
| `npm run db:studio` | Abre o Prisma Studio para olhar o banco |
| `npm run icones` | Regera os ícones do PWA a partir da marca |

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind 4 · shadcn/ui (Radix) · Prisma 7 + PostgreSQL ·
Better Auth (e-mail/senha + organizações) · react-hook-form + zod · @react-pdf/renderer · Vitest.

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
