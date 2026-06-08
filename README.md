# Lorinvest Intelligence

Plataforma de monitoramento de notícias e inteligência setorial para o grupo
Lorinvest. Inspirada na Knewin, porém com arquitetura moderna, UX em Kanban,
modo escuro nativo e enriquecimento via IA (Claude).

## Visão geral

- **Setores** como abas independentes (Mineração, Navegação, Florestas, Gás
  Natural, Mercado Financeiro).
- **Temas** como colunas Kanban (Portfólio, Concorrentes/Parceiros, Produto,
  Foco, Internacional, Importante).
- **Cards de notícia** com título, fonte, data, URL, palavras-chave que
  casaram, resumo IA, insight estratégico, score 0-100, sentimento e ações
  (favoritar / marcar importante / abrir original).
- **Regras de classificação** seguindo a spec: Portfólio e Concorrentes
  exclusivos (regras 1 e 2), Importante via duplicação automática quando o
  termo aparece no título (regra 5), Internacional alimentada por fontes
  marcadas como internacionais.
- **Pipeline de ingestão**: RSS, Google News RSS, NewsAPI/GNews (mesma forma
  do RSS), com pontos de extensão para scraping (Playwright) e fontes
  manuais.
- **Enriquecimento IA via Claude** (`@anthropic-ai/sdk`): resumo executivo,
  categoria, sentimento, score de relevância e insight estratégico.
- **Cron Jobs Vercel** rodando seg-sex às 07h/09h/11h/13h/15h/17h/19h (UTC-3).
- **Dashboard executivo** com KPIs, distribuição por setor/categoria,
  sentimento agregado, top notícias e radar de tendências.
- **Painel de saúde** mostrando status de cada fonte e últimas execuções.
- **Dark mode nativo** (`next-themes`) com preferência persistida.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + componentes inspirados em ShadCN
- Prisma + PostgreSQL
- Anthropic SDK (`claude-sonnet-4-6` por padrão)
- `rss-parser` para ingestão de feeds
- `next-themes` para dark mode
- Vercel Cron para agendamento

Comparado à spec original (NestJS + Next 15 + Elasticsearch + BullMQ + Redis
+ Playwright + Auth.js), esta versão usa Next.js full-stack para reduzir
complexidade de deploy, Postgres full-text via `ilike` para a busca e Vercel
Cron para agendamento. Os módulos foram desenhados para serem trocados sem
re-escrever o domínio (`src/lib/ingest`, `src/lib/ai`).

## Estrutura

```
prisma/
  schema.prisma         # Setores, Temas, Keywords, Sources, NewsItem, Classifications, Runs, Users
  seed.ts               # Seed dos 5 setores com colunas e palavras-chave iniciais
src/
  app/
    page.tsx            # Redirect para o primeiro setor
    intelligence/[sector]/page.tsx   # Kanban por setor (a feature principal)
    admin/              # Setores, Temas, Fontes, Keywords, Saúde, Usuários
    dashboard/page.tsx  # Dashboard executivo
    api/
      cron/ingest/      # Endpoint disparado pelo Vercel Cron
      ingest/run/       # "Atualizar Agora"
      keywords/         # CRUD
      sources/          # CRUD
      sectors/          # CRUD
      themes/           # CRUD
      news/[id]/favorite, news/[id]/important
      search/           # Busca full-text dentro de um setor
  components/
    app-header.tsx      # Logo + busca global + atualizar + dark mode
    sector-tabs.tsx     # Abas de setores
    filter-bar.tsx      # Período + ordenação
    kanban-board.tsx    # Colunas por tema
    news-card.tsx       # Card de notícia com todas as informações
    ui/                 # Primitivas (button, input, card, badge)
    theme-provider.tsx, theme-toggle.tsx
  lib/
    db.ts               # Prisma client singleton
    utils.ts            # cn, formatRelative, hostnameFromUrl, truncate
    ai/claude.ts        # Enriquecimento via Claude (no-op se sem API key)
    ingest/rss.ts       # Parser de RSS
    ingest/classify.ts  # Regras 1-5 de classificação
    ingest/fingerprint.ts
    ingest/run.ts       # Orquestrador do pipeline
scripts/
  ingest.ts             # `npm run ingest` para rodar localmente
vercel.json             # 7 cron jobs seg-sex
```

## Setup local

```bash
cp .env.example .env.local
# Edite DATABASE_URL e (opcional) ANTHROPIC_API_KEY

npm install
npm run db:push       # cria as tabelas (sem migrations versionadas)
npm run db:seed       # popula setores, temas e fontes
npm run dev
```

Acesse `http://localhost:3000` — você cai direto em `/intelligence/mineracao`.
Use o botão "Atualizar Agora" no header para disparar a ingestão (ou rode
`npm run ingest` no terminal).

## Variáveis de ambiente

| Variável | Função |
|----------|--------|
| `DATABASE_URL` | PostgreSQL (Supabase, Neon, RDS, etc.) |
| `ANTHROPIC_API_KEY` | Habilita enriquecimento IA via Claude |
| `ANTHROPIC_MODEL` | Modelo Claude (padrão `claude-sonnet-4-6`) |
| `CRON_SECRET` | Bearer token exigido por `/api/cron/ingest` |
| `NEWS_API_KEY` | (Opcional) NewsAPI complementar |

## Regras de classificação implementadas

1. **Portfólio** — keyword exclusiva. Se casar, a notícia entra **apenas** em Portfólio.
2. **Concorrentes/Parceiros** — exclusiva. Mesmo comportamento.
3. **Demais colunas** — uma notícia pode ser duplicada entre Produto, Foco etc.
4. **Importante** — nunca recebe notícia diretamente; é duplicada quando o
   termo aparece no título ou via marcação manual.
5. **Auto-importante** — keyword no título marca `important = true` e
   duplica para a coluna Importante. O usuário pode remover via botão.

Implementado em `src/lib/ingest/classify.ts` com testes de regex por
palavra inteira, suporte a `AND` (`requireAll`) e `NOT` (`excludeAny`).

## Cron jobs

Configurados em `vercel.json` em UTC, equivalentes ao horário de Brasília
solicitado (07h às 19h, seg-sex). Cada run percorre todas as fontes ativas,
deduplica por fingerprint (URL + título normalizado) e enfileira o
enriquecimento IA por item.

## Próximos passos (não cobertos nesta iteração)

- Auth.js com papéis Admin/Analista/Leitor (modelo `User` já preparado).
- Scraping com Playwright (placeholder em `SourceType.SCRAPER`).
- Alertas inteligentes por e-mail (Resend) — variáveis já reservadas.
- Migrações Prisma versionadas (`prisma/migrations`).
- Substituição de busca `ilike` por `tsvector` + GIN ou Elasticsearch.
- BullMQ + Redis se o volume crescer ao ponto de não caber em uma run síncrona.
