'use client'

import * as React from 'react'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StockTable } from '@/components/stock/StockTable'
import { StockLevel, UOM } from '@/types'
import { formatCurrency } from '@/lib/utils'

// Mock stock data for demo
const mockStockData: StockLevel[] = [
  {
    productId: '1',
    productName: 'Frango Inteiro',
    sku: 'FRG-001',
    unitId: 'u1',
    unitName: 'Unidade Centro',
    currentStock: 45.5,
    unitOfMeasure: 'KG' as UOM,
    minStock: 20,
    idealStock: 50,
    averageCost: 18.5,
    totalValue: 841.75,
    status: 'OK',
  },
  {
    productId: '2',
    productName: 'Salmão Fresco',
    sku: 'SAL-001',
    unitId: 'u1',
    unitName: 'Unidade Centro',
    currentStock: 3.2,
    unitOfMeasure: 'KG' as UOM,
    minStock: 5,
    idealStock: 15,
    averageCost: 89.9,
    totalValue: 287.68,
    status: 'CRITICAL',
  },
  {
    productId: '3',
    productName: 'Tomate Italiano',
    sku: 'TMT-001',
    unitId: 'u1',
    unitName: 'Unidade Centro',
    currentStock: 8.0,
    unitOfMeasure: 'KG' as UOM,
    minStock: 10,
    idealStock: 30,
    averageCost: 7.5,
    totalValue: 60.0,
    status: 'LOW',
  },
  {
    productId: '4',
    productName: 'Queijo Minas Frescal',
    sku: 'QMN-001',
    unitId: 'u1',
    unitName: 'Unidade Centro',
    currentStock: 0,
    unitOfMeasure: 'KG' as UOM,
    minStock: 3,
    idealStock: 10,
    averageCost: 32.0,
    totalValue: 0,
    status: 'RUPTURE',
  },
  {
    productId: '5',
    productName: 'Azeite Extra Virgem',
    sku: 'AZT-001',
    unitId: 'u1',
    unitName: 'Unidade Centro',
    currentStock: 0,
    unitOfMeasure: 'L' as UOM,
    minStock: 5,
    idealStock: 20,
    averageCost: 45.0,
    totalValue: 0,
    status: 'RUPTURE',
  },
  {
    productId: '6',
    productName: 'Farinha de Trigo',
    sku: 'FRN-001',
    unitId: 'u1',
    unitName: 'Unidade Centro',
    currentStock: 65.0,
    unitOfMeasure: 'KG' as UOM,
    minStock: 25,
    idealStock: 80,
    averageCost: 4.2,
    totalValue: 273.0,
    status: 'OK',
  },
  {
    productId: '7',
    productName: 'Creme de Leite',
    sku: 'CRM-001',
    unitId: 'u2',
    unitName: 'Unidade Shopping',
    currentStock: 24,
    unitOfMeasure: 'UN' as UOM,
    minStock: 12,
    idealStock: 48,
    averageCost: 5.8,
    totalValue: 139.2,
    status: 'OK',
  },
]

const statusCounts = {
  OK: mockStockData.filter((s) => s.status === 'OK').length,
  LOW: mockStockData.filter((s) => s.status === 'LOW').length,
  CRITICAL: mockStockData.filter((s) => s.status === 'CRITICAL').length,
  RUPTURE: mockStockData.filter((s) => s.status === 'RUPTURE').length,
}

const totalValue = mockStockData.reduce((sum, s) => sum + s.totalValue, 0)

export default function EstoquePage() {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL')
  const [loading, setLoading] = React.useState(false)

  const filtered = mockStockData.filter((item) => {
    const matchSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Estoque Atual</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} produtos &middot; Valor total:{' '}
            <span className="font-semibold text-gray-700">{formatCurrency(totalValue)}</span>
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} loading={loading}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: 'Todos', count: mockStockData.length, color: 'bg-gray-100 text-gray-700' },
          { key: 'OK', label: 'OK', count: statusCounts.OK, color: 'bg-green-100 text-green-700' },
          { key: 'LOW', label: 'Baixo', count: statusCounts.LOW, color: 'bg-amber-100 text-amber-700' },
          { key: 'CRITICAL', label: 'Crítico', count: statusCounts.CRITICAL, color: 'bg-orange-100 text-orange-700' },
          { key: 'RUPTURE', label: 'Ruptura', count: statusCounts.RUPTURE, color: 'bg-red-100 text-red-700' },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${s.color} ${
              statusFilter === s.key ? 'ring-2 ring-offset-1 ring-current opacity-100' : 'opacity-70 hover:opacity-100'
            }`}
          >
            {s.label} ({s.count})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar produto ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          Unidade
        </Button>
      </div>

      {/* Stock Table */}
      <Card>
        <StockTable data={filtered} loading={loading} />
      </Card>
    </div>
  )
}
