import * as React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantConfig = {
  default: { bg: 'bg-blue-50', iconText: 'text-blue-600', valueText: 'text-gray-900' },
  success: { bg: 'bg-green-50', iconText: 'text-green-600', valueText: 'text-gray-900' },
  warning: { bg: 'bg-amber-50', iconText: 'text-amber-600', valueText: 'text-gray-900' },
  danger: { bg: 'bg-red-50', iconText: 'text-red-600', valueText: 'text-red-700' },
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: KPICardProps) {
  const config = variantConfig[variant]

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className={cn('mt-1 text-2xl font-bold tracking-tight', config.valueText)}>
              {value}
            </p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
            {trend && (
              <div className="mt-2 flex items-center gap-1">
                {trend.value >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.value >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {Math.abs(trend.value)}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div className={cn('rounded-lg p-2.5 ml-3', config.bg)}>
            <Icon className={cn('h-5 w-5', config.iconText)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
