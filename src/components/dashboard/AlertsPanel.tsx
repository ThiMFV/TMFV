import * as React from 'react'
import { AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertSeverity, AlertType } from '@/types'
import { formatDateTime } from '@/lib/utils'

interface AlertsPanelProps {
  alerts: (Alert & {
    unit?: { name: string }
    product?: { name: string } | null
  })[]
}

const severityConfig: Record<
  AlertSeverity,
  { icon: React.ElementType; bg: string; text: string; border: string }
> = {
  LOW: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  MEDIUM: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  HIGH: { icon: AlertCircle, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  CRITICAL: { icon: Zap, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

const alertTypeLabel: Record<AlertType, string> = {
  LOW_STOCK: 'Estoque Baixo',
  EXPIRING_PRODUCT: 'Produto Vencendo',
  INVENTORY_DIVERGENCE: 'Divergência de Estoque',
  HIGH_LOSSES: 'Alto Índice de Perdas',
  SUPPLIER_DELAYED: 'Fornecedor Atrasado',
  RUPTURE: 'Ruptura de Estoque',
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alertas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Info className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhum alerta no momento</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alertas Recentes</CardTitle>
          <span className="text-xs font-medium text-gray-500">
            {alerts.filter((a) => !a.read).length} não lidos
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-100">
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity]
            const Icon = config.icon

            return (
              <li
                key={alert.id}
                className={cn(
                  'flex gap-3 p-4 transition-colors',
                  !alert.read && 'bg-gray-50'
                )}
              >
                <div className={cn('mt-0.5 rounded-full p-1.5', config.bg)}>
                  <Icon className={cn('h-3.5 w-3.5', config.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded',
                        config.bg,
                        config.text
                      )}
                    >
                      {alertTypeLabel[alert.type]}
                    </span>
                    {!alert.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-800 line-clamp-2">{alert.message}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(alert.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
