# GastroControl — Sistema SaaS de Gestão de Inventário para Restaurantes

Sistema enterprise multi-tenant para controle operacional e gestão de estoque de redes de restaurantes.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **PostgreSQL** + Prisma ORM
- **JWT** com RBAC multi-tenant
- **Tailwind CSS** + Radix UI

## Setup Rápido

### 1. Instalar dependências
\`\`\`bash
npm install
\`\`\`

### 2. Configurar variáveis de ambiente
\`\`\`bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
\`\`\`

### 3. Configurar banco de dados
\`\`\`bash
# Criar o banco (PostgreSQL deve estar rodando)
createdb gastrocontrol

# Rodar migrações
npm run db:migrate

# Popular com dados iniciais
npm run db:seed
\`\`\`

### 4. Iniciar o servidor
\`\`\`bash
npm run dev
# Acesse: http://localhost:3000
\`\`\`

## Credenciais do Seed

| Perfil | Email | Senha |
|--------|-------|-------|
| GROUP_ADMIN | admin@grupogourmet.com.br | Admin@123 |
| BRAND_ADMIN | gerente.burger@grupogourmet.com.br | Gerente@123 |
| STOCK_KEEPER | estoquista.sb001@grupogourmet.com.br | Estoque@123 |

## Estrutura Multi-Tenant

```
Grupo Gourmet
├── Smash Burger (BURGER)
│   ├── SB-001 - Vila Madalena
│   └── SB-002 - Pinheiros
├── La Pizza (PIZZA)
│   └── LP-001 - Moema
└── Café Verde (CAFE)
    └── CV-001 - Jardins
```

## Módulos

| Módulo | URL | Status |
|--------|-----|--------|
| Dashboard | /dashboard | ✅ |
| Estoque Atual | /estoque | ✅ |
| Produtos | /produtos | ✅ |
| Perdas | /perdas | ✅ |
| Compras | /compras | 🔧 Em breve |
| Fichas Técnicas | /fichas-tecnicas | 🔧 Em breve |
| Inventário | /inventario | 🔧 Em breve |
| Relatórios | /relatorios | 🔧 Em breve |

## APIs REST

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/login` | POST | Login + JWT |
| `/api/products` | GET/POST | Produtos |
| `/api/stock/current` | GET | Estoque atual |
| `/api/stock/movements` | GET/POST | Movimentações |
| `/api/losses` | GET/POST | Perdas |
| `/api/technical-sheets` | GET/POST | Fichas técnicas |
| `/api/purchase-requests` | GET/POST | Solicitações de compra |
| `/api/purchase-orders` | GET/POST | Pedidos de compra |
| `/api/inventory-counts` | GET/POST | Inventário cíclico |
| `/api/dashboard/summary` | GET | KPIs consolidados |
| `/api/alerts` | GET | Alertas |
| `/api/pdv/webhook` | POST | Integração PDV |

## Permissões RBAC

| Role | Escopo |
|------|--------|
| GROUP_ADMIN | Acesso total ao grupo |
| BRAND_ADMIN | Apenas sua marca |
| UNIT_MANAGER | Apenas sua unidade |
| STOCK_KEEPER | Controle operacional |
| BUYER | Gestão de compras |
| FINANCIAL | Custos e relatórios |
