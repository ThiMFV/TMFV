# Lorinvest Newsletter Platform

## Visao Geral
Plataforma de Newsletter para o grupo Lorinvest. O sistema monitora palavras-chave e canais definidos, busca noticias relevantes e gera newsletters automatizadas para os assinantes.

## Stack Tecnologica
- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Estilizacao**: Tailwind CSS
- **Banco de Dados**: PostgreSQL (via Prisma ORM)
- **Busca de Noticias**: NewsAPI + RSS feeds
- **Envio de Email**: Resend
- **Agendamento**: Vercel Cron Jobs

## Estrutura do Projeto
```
src/
  app/              # Rotas Next.js (App Router)
    api/            # API Routes
    dashboard/      # Painel administrativo
    newsletters/    # Listagem e visualizacao de newsletters
  components/       # Componentes React reutilizaveis
  lib/              # Utilitarios, clientes de API, helpers
    news/           # Logica de busca de noticias
    email/          # Logica de envio de email
    db/             # Cliente Prisma e queries
  types/            # Tipos TypeScript compartilhados
prisma/
  schema.prisma     # Schema do banco de dados
```

## Conceitos Principais

### Palavras-chave (Keywords)
Termos que o sistema usa para buscar noticias (ex: "fundos imobiliarios", "selic", "ibovespa").

### Canais
Fontes de noticias monitoradas (ex: Google News RSS, NewsAPI, sites especificos de financas).

### Newsletter
Agregacao de noticias filtradas pelas palavras-chave, formatada em HTML e enviada para assinantes.

### Assinantes (Subscribers)
Emails cadastrados para receber as newsletters.

## Comandos Essenciais
```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (porta 3000)
npm run build        # Build de producao
npm run lint         # Verifica erros de lint
npm run typecheck    # Verifica tipos TypeScript

# Banco de dados
npm run db:migrate   # Executa migracoes Prisma
npm run db:studio    # Abre Prisma Studio (GUI do banco)
npm run db:seed      # Popula banco com dados iniciais
```

## Variaveis de Ambiente
Arquivo `.env.local` (nao commitar):
```
DATABASE_URL=          # URL do PostgreSQL
NEWS_API_KEY=          # Chave da NewsAPI (newsapi.org)
RESEND_API_KEY=        # Chave da Resend para envio de emails
CRON_SECRET=           # Secret para autenticar cron jobs
NEXTAUTH_SECRET=       # Secret para autenticacao (se aplicavel)
```

## Convencoes de Codigo
- Componentes React: PascalCase (ex: `NewsCard.tsx`)
- Funcoes e variaveis: camelCase
- Arquivos de rota API: `route.ts`
- Tipos: prefixo `T` ou sufixo `Type` (ex: `NewsItem`, `SubscriberType`)
- Sempre usar TypeScript strict mode
- Preferir Server Components no Next.js, Client Components apenas quando necessario

## Fluxo Principal
1. Admin define palavras-chave e canais no dashboard
2. Cron job roda periodicamente (ex: diariamente as 7h)
3. Sistema busca noticias nas fontes configuradas usando as palavras-chave
4. Noticias sao deduplicadas e rankeadas por relevancia
5. Newsletter e gerada em HTML
6. Email e enviado para lista de assinantes
7. Registro de envio e salvo no banco

## Decisoes de Arquitetura
- App Router do Next.js para simplicidade de deployment no Vercel
- Prisma como ORM para type-safety no banco de dados
- Resend como servico de email por ser moderno e com boa API
- NewsAPI como fonte primaria + RSS feeds como complemento gratuito
