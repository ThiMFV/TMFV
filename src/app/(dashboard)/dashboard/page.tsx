import * as React from 'react'
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Package,
} from 'lucide-react'
import { KPICard } from '@/components/dashboard/KPICard'
import { AlertsPanel } from '@/components/dashboard/AlertsPanel'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { LossType } from '@prisma/client'

// Mock data for demo - in production this would come from the API
const mockDashboardData = {
  totalStockValue: 185420.5,
  cmvPercent: 32.4,
  lossesThisMonth: 4230.8,
  ruptureCount: 3,
  lowStockCount: 7,
  recentAlerts: [
    {
      id: '1',
      type: 'LOW_STOCK' as const,
      unitId: 'u1',
      productId: 'p1',
      message: 'Frango Inteiro abaixo do estoque mínimo na Unidade Centro',
      severity: 'HIGH' as const,
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '2',
      type: 'EXPIRING_PRODUCT' as const,
      unitId: 'u1',
      productId: 'p2',
      message: 'Creme de Leite vence em 2 dias - Lote L2024-001',
      severity: 'CRITICAL' as const,
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '3',
      type: 'RUPTURE' as const,
      unitId: 'u2',
      productId: 'p3',
      message: 'Ruptura de Azeite Extra Virgem na Unidade Shopping',
      severity: 'CRITICAL' as const,
      read: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: '4',
      type: 'HIGH_LOSSES' as const,
      unitId: 'u1',
      productId: null,
      message: 'Perdas acima do limite mensal: R$ 4.230 (meta: R$ 3.000)',
      severity: 'MEDIUM' as const,
      read: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ],
  topLosses: [
    { productName: 'Frango Inteiro', totalLoss: 1240.5, type: 'EXPIRY' as LossType },
    { productName: 'Tomate Italiano', totalLoss: 890.2, type: 'BREAKAGE' as LossType },
    { productName: 'Salmão Fresco', totalLoss: 760.8, type: 'EXPIRY' as LossType },
    { productName: 'Queijo Minas', totalLoss: 640.3, type: 'EXPIRY' as LossType },
    { productName: 'Alface Americana', totalLoss: 420.1, type: 'EXCESS_PRODUCTION' as LossType },
  ],
  stockChartData: Array.from({ length: 30 }, (_, i) => ({
    date: `${String(i + 1).padStart(2, '0')}/06`,
    value: 170000 + Math.random() * 30000,
  })),
}

const lossTypeLabel: Record<LossType, string> = {
  EXPIRY: 'Vencimento',
  BREAKAGE: 'Quebra',
  EXCESS_PRODUCTION: 'Sobra Produção',
  OPERATIONAL_ERROR: 'Erro Operacional',
  THEFT: 'Furto',
  SANITARY_DISCARD: 'Descarte Sanitário',
}

// Import recharts dynamically to avoid SSR issues
async function StockChart({ data }: { data: { date: string; value: number }[] }) {
  // Simplified chart representation for server component
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Estoque (30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 flex items-end gap-0.5">
          {data.map((d, i) => {
            const max = Math.max(...data.map((x) => x.value))
            const height = (d.value / max) * 100
            return (
              <div
                key={i}
                className="flex-1 bg-blue-500 rounded-t opacity-70 hover:opacity-100 transition-opacity"
                style={{ height: `${height}%` }}
                title={`${d.date}: ${formatCurrency(d.value)}`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">{data[0]?.date}</span>
          <span className="text-xs text-gray-400">{data[data.length - 1]?.date}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const d = mockDashboardData

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral das operações</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total em Estoque"
          value={formatCurrency(d.totalStockValue)}
          subtitle="Valor atual do inventário"
          icon={Package}
          variant="default"
          trend={{ value: 4.2, label: 'vs. mês anterior' }}
        />
        <KPICard
          title="CMV do Mês"
          value={`${d.cmvPercent}%`}
          subtitle="Custo de mercadoria vendida"
          icon={TrendingDown}
          variant={d.cmvPercent > 35 ? 'danger' : d.cmvPercent > 30 ? 'warning' : 'success'}
          trend={{ value: -1.8, label: 'vs. mês anterior' }}
        />
        <KPICard
          title="Perdas do Mês"
          value={formatCurrency(d.lossesThisMonth)}
          subtitle="Total de perdas registradas"
          icon={AlertTriangle}
          variant={d.lossesThisMonth > 5000 ? 'danger' : d.lossesThisMonth > 3000 ? 'warning' : 'success'}
          trend={{ value: 12.4, label: 'vs. mês anterior' }}
        />
        <KPICard
          title="Produtos em Ruptura"
          value={String(d.ruptureCount)}
          subtitle={`${d.lowStockCount} com estoque baixo`}
          icon={DollarSign}
          variant={d.ruptureCount > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <StockChart data={d.stockChartData} />
        </div>
        <div>
          <AlertsPanel alerts={d.recentAlerts as Parameters<typeof AlertsPanel>[0]['alerts']} />
        </div>
      </div>

      {/* Top Losses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Perdas do Mês</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor da Perda</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.topLosses.map((loss, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-gray-400 font-mono text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-medium text-gray-900">{loss.productName}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{lossTypeLabel[loss.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatCurrency(loss.totalLoss)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
