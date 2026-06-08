'use client'

import * as React from 'react'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StockLevel } from '@/types'

interface StockTableProps {
  data: StockLevel[]
  loading?: boolean
}

const statusConfig: Record<
  StockLevel['status'],
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  OK: { label: 'OK', variant: 'success' },
  LOW: { label: 'Baixo', variant: 'warning' },
  CRITICAL: { label: 'Crítico', variant: 'danger' },
  RUPTURE: { label: 'Ruptura', variant: 'danger' },
}

const uomLabels: Record<string, string> = {
  KG: 'kg',
  G: 'g',
  L: 'L',
  ML: 'mL',
  UN: 'un',
  CX: 'cx',
  PCT: 'pct',
  SC: 'sc',
  BD: 'bd',
}

export function StockTable({ data, loading }: StockTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <p className="text-sm">Nenhum produto encontrado</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produto</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead className="text-right">Qtd Atual</TableHead>
          <TableHead className="text-right">Estoque Mínimo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Custo Médio</TableHead>
          <TableHead className="text-right">Valor Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => {
          const status = statusConfig[item.status]
          const uom = uomLabels[item.unitOfMeasure] || item.unitOfMeasure
          const fillPercent =
            item.minStock > 0
              ? Math.min(100, (item.currentStock / item.minStock) * 100)
              : 100

          return (
            <TableRow key={`${item.productId}-${item.unitId}`}>
              <TableCell>
                <span className="font-medium text-gray-900">{item.productName}</span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-gray-500">{item.sku}</span>
              </TableCell>
              <TableCell className="text-gray-600">{item.unitName}</TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    'font-semibold',
                    item.status === 'RUPTURE' && 'text-red-600',
                    item.status === 'CRITICAL' && 'text-orange-600',
                    item.status === 'LOW' && 'text-amber-600',
                    item.status === 'OK' && 'text-gray-900'
                  )}
                >
                  {formatNumber(item.currentStock)} {uom}
                </span>
              </TableCell>
              <TableCell className="text-right text-gray-500">
                {formatNumber(item.minStock)} {uom}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  {item.minStock > 0 && (
                    <div className="hidden sm:block w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          item.status === 'OK' && 'bg-green-500',
                          item.status === 'LOW' && 'bg-amber-500',
                          item.status === 'CRITICAL' && 'bg-orange-500',
                          item.status === 'RUPTURE' && 'bg-red-500'
                        )}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right text-gray-600">
                {formatCurrency(item.averageCost)}
              </TableCell>
              <TableCell className="text-right font-semibold text-gray-900">
                {formatCurrency(item.totalValue)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
