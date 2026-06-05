# GastroControl — Restaurant OS

## Visao Geral
Sistema enterprise SaaS de gestao de estoque e controle operacional para grupos de restaurantes.
Multi-tenant: suporta Grupos > Marcas > Unidades com RBAC completo.

## Stack Tecnologica
- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Estilizacao**: Tailwind CSS + Radix UI
- **Banco de Dados**: PostgreSQL (via Prisma ORM)
- **Autenticacao**: JWT customizado (jose/jsonwebtoken) + httpOnly cookie
- **Validacao**: Zod (API e forms)
- **Forms**: react-hook-form + @hookform/resolvers
- **Charts**: recharts (quando necessario no client)
- **Cache/Queue**: ioredis (opcional)

## Estrutura do Projeto
```
src/
  app/
    (dashboard)/       # Layout autenticado com sidebar
      dashboard/       # Pagina inicial com KPIs
      estoque/         # Estoque atual por unidade
      produtos/        # Cadastro de produtos
      perdas/          # Registro e historico de perdas
      compras/         # Pedidos e solicitacoes de compra
      inventario/      # Contagens de estoque
      fichas-tecnicas/ # Fichas tecnicas (receitas)
    api/
      auth/login       # POST login → JWT
      auth/logout      # POST logout
      products/        # CRUD produtos
      stock/movements  # Movimentacoes de estoque
      stock/current    # Estoque atual agregado
      purchase-requests/ # Solicitacoes de compra
      purchase-orders/  # Pedidos de compra
      technical-sheets/ # Fichas tecnicas
      losses/           # Registro de perdas
      inventory-counts/ # Contagens fisicas
      dashboard/summary # Metricas do dashboard
      alerts/           # Alertas do sistema
      pdv/webhook       # Webhook para integrar PDVs (auto-decrementa estoque)
    login/             # Pagina de login
  components/
    ui/                # Button, Input, Card, Badge, Table, Modal, Select, Alert
    dashboard/         # KPICard, AlertsPanel
    stock/             # StockTable
    products/          # ProductForm
  lib/
    auth/jwt.ts        # signToken, verifyToken
    auth/permissions.ts # RBAC helpers (canAccessGroup, etc.)
    auth/context.ts    # getUserFromRequest (extrai user dos headers)
    db/prisma.ts       # Singleton Prisma client
    utils.ts           # cn(), formatCurrency(), formatDate()
  middleware.ts        # JWT auth middleware (protege /api/* e paginas)
  types/index.ts       # Tipos Prisma re-exportados + DTOs
prisma/
  schema.prisma        # Schema completo multi-tenant
```

## Modelos Principais (Prisma)
- **Group** → **Brand** → **Unit** (hierarquia multi-tenant)
- **User** com roles: GROUP_ADMIN, BRAND_ADMIN, UNIT_MANAGER, STOCK_KEEPER, BUYER, FINANCIAL
- **Product** com SKU unico por grupo, UOM (KG/G/L/ML/UN/CX/PCT/SC/BD)
- **InventoryLot** com FIFO para baixa automatica
- **StockMovement** para toda movimentacao (ENTRY/CONSUMPTION/LOSS/TRANSFER/ADJUSTMENT)
- **TechnicalSheet** com ingredientes e custo calculado
- **PurchaseRequest** → **PurchaseOrder** → **GoodsReceipt**
- **LossRecord** com tipos (EXPIRY/BREAKAGE/EXCESS_PRODUCTION/THEFT/etc.)
- **InventoryCount** para contagens periodicas com divergencia
- **Alert** para notificacoes (LOW_STOCK/RUPTURE/EXPIRING/HIGH_LOSSES/etc.)
- **PDVIntegration** + **SaleEvent** para integracao com sistemas de PDV

## Comandos Essenciais
```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento (porta 3000)
npm run build        # Build de producao
npm run lint         # Verifica erros de lint
npm run typecheck    # Verifica tipos TypeScript

# Banco de dados
npm run db:migrate   # Executa migracoes Prisma
npm run db:generate  # Gera client Prisma
npm run db:studio    # Abre Prisma Studio (GUI do banco)
npm run db:seed      # Popula banco com dados iniciais
```

## Variaveis de Ambiente
Arquivo `.env.local` (nao commitar):
```
DATABASE_URL=              # URL do PostgreSQL
JWT_SECRET=                # Secret para assinar JWTs (min 32 chars)
PDV_WEBHOOK_SECRET=        # Secret para autenticar webhooks de PDV
```

## Convencoes de Codigo
- Componentes React: PascalCase (ex: `KPICard.tsx`)
- Funcoes e variaveis: camelCase
- Arquivos de rota API: `route.ts`
- Usar `cn()` de `@/lib/utils` para classNames condicionais
- Sempre usar TypeScript strict mode
- Server Components por padrao; `'use client'` apenas quando necessario (forms, estado, eventos)
- Todas as API routes validam input com Zod
- Todas as queries filtram por tenant (groupId/brandId/unitId) do JWT

## Fluxo de Autenticacao
1. POST `/api/auth/login` com email+senha → retorna JWT + seta cookie httpOnly
2. Middleware em `src/middleware.ts` verifica JWT em toda rota
3. Headers `x-user-*` propagam contexto do usuario para as route handlers
4. `getUserFromRequest()` extrai o contexto nos handlers

## Fluxo PDV → Estoque
1. PDV envia POST para `/api/pdv/webhook` com venda
2. Webhook encontra unidade pelo `unitCode`
3. Para cada item vendido, busca ficha tecnica correspondente
4. Baixa ingredientes via FIFO nos lotes ativos
5. Cria StockMovements do tipo CONSUMPTION

## Decisoes de Arquitetura
- JWT customizado (sem NextAuth) para controle total do payload multi-tenant
- Soft-delete nos produtos (campo `active`)
- Custo medio ponderado (WACC) atualizado a cada entrada
- Alertas gerados por jobs/eventos (modelo Alert no banco)
- Middleware centralizado evita verificar auth em cada route handler individualmente
