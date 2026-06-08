'use client'

import * as React from 'react'
import { BarChart3, TrendingDown, Package, ShoppingCart, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

const reportCards = [
  {
    id: 'cmv',
    title: 'Relatório de CMV',
    description: 'Custo da Mercadoria Vendida por período. Análise de eficiência de custos e comparativo com meta.',
    icon: BarChart3,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    stats: [
      { label: 'CMV Atual', value: '28,4%', trend: 'up' as const },
      { label: 'Meta', value: '30,0%' },
      { label: 'Diferença', value: '-1,6 p.p.', trend: 'down' as const },
    ],
  },
  {
    id: 'perdas',
    title: 'Relatório de Perdas',
    description: 'Histórico e análise de perdas por tipo, produto e unidade. Identificação de padrões de desperdício.',
    icon: TrendingDown,
    color: 'text-red-600',
    bg: 'bg-red-50',
    stats: [
      { label: 'Perdas no mês', value: formatCurrency(4280), trend: 'up' as const },
      { label: 'vs. mês anterior', value: '+12%', trend: 'up' as const },
      { label: 'Principal causa', value: 'Vencimento' },
    ],
  },
  {
    id: 'estoque',
    title: 'Relatório de Estoque',
    description: 'Posição atual do estoque, giro de produtos, itens com ruptura e próximos ao vencimento.',
    icon: Package,
    color: 'text-green-600',
    bg: 'bg-green-50',
    stats: [
      { label: 'Valor total', value: formatCurrency(87500) },
      { label: 'Rupturas', value: '3 itens', trend: 'up' as const },
      { label: 'Vencendo em 7d', value: '5 itens' },
    ],
  },
  {
    id: 'compras',
    title: 'Relatório de Compras',
    description: 'Volume de compras por fornecedor, pedidos por período e análise de preços de insumos.',
    icon: ShoppingCart,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    stats: [
      { label: 'Compras no mês', value: formatCurrency(38200) },
      { label: 'Pedidos', value: '12 POs' },
      { label: 'Fornecedores', value: '8 ativos' },
    ],
  },
]

export default function RelatoriosPage() {
  const [dateFrom, setDateFrom] = React.useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().substring(0, 10)
  })
  const [dateTo, setDateTo] = React.useState(() => new Date().toISOString().substring(0, 10))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análises e exportações de dados operacionais</p>
        </div>
      </div>

      {/* Date range filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm font-medium text-gray-700">Período:</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-500 text-sm">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline" size="sm">
          Aplicar
        </Button>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.bg}`}>
                      <Icon className={`h-5 w-5 ${report.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.title}</CardTitle>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  {report.stats.map((stat) => (
                    <div key={stat.label} className="text-center p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                      <p className={`text-sm font-bold ${
                        stat.trend === 'up' ? 'text-red-600' :
                        stat.trend === 'down' ? 'text-green-600' :
                        'text-gray-900'
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  Visualizar Relatório
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
