'use client'

import * as React from 'react'
import { Plus, Filter } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LossType, UOM } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'

const lossTypeLabel: Record<LossType, string> = {
  EXPIRY: 'Vencimento',
  BREAKAGE: 'Quebra',
  EXCESS_PRODUCTION: 'Sobra de Produção',
  OPERATIONAL_ERROR: 'Erro Operacional',
  THEFT: 'Furto',
  SANITARY_DISCARD: 'Descarte Sanitário',
}

const lossTypeVariant: Record<LossType, 'danger' | 'warning' | 'neutral'> = {
  EXPIRY: 'danger',
  BREAKAGE: 'warning',
  EXCESS_PRODUCTION: 'neutral',
  OPERATIONAL_ERROR: 'warning',
  THEFT: 'danger',
  SANITARY_DISCARD: 'neutral',
}

// Mock data
const mockLosses = [
  {
    id: '1',
    product: { name: 'Frango Inteiro', sku: 'FRG-001' },
    unit: { name: 'Unidade Centro' },
    user: { name: 'Carlos Souza' },
    type: 'EXPIRY' as LossType,
    quantity: 4.5,
    unitOfMeasure: 'KG' as UOM,
    unitCost: 18.5,
    totalCost: 83.25,
    reason: 'Produto atingiu data de validade',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    product: { name: 'Tomate Italiano', sku: 'TMT-001' },
    unit: { name: 'Unidade Centro' },
    user: { name: 'Ana Lima' },
    type: 'BREAKAGE' as LossType,
    quantity: 3.0,
    unitOfMeasure: 'KG' as UOM,
    unitCost: 7.5,
    totalCost: 22.5,
    reason: 'Queda de caixas no recebimento',
    reportedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    product: { name: 'Creme de Leite', sku: 'CRM-001' },
    unit: { name: 'Unidade Shopping' },
    user: { name: 'Pedro Santos' },
    type: 'EXCESS_PRODUCTION' as LossType,
    quantity: 6,
    unitOfMeasure: 'UN' as UOM,
    unitCost: 5.8,
    totalCost: 34.8,
    reason: 'Sobra de molho não utilizado',
    reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

const summaryByType = Object.entries(
  mockLosses.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + l.totalCost
    return acc
  }, {} as Record<LossType, number>)
).map(([type, total]) => ({ type: type as LossType, total }))

const totalLoss = mockLosses.reduce((sum, l) => sum + l.totalCost, 0)

const lossSchema = z.object({
  productId: z.string().min(1, 'Produto obrigatório'),
  unitId: z.string().min(1, 'Unidade obrigatória'),
  type: z.nativeEnum(LossType, { errorMap: () => ({ message: 'Tipo obrigatório' }) }),
  quantity: z.coerce.number().positive('Quantidade deve ser positiva'),
  unitCost: z.coerce.number().min(0, 'Custo não pode ser negativo'),
  reason: z.string().min(5, 'Motivo deve ter pelo menos 5 caracteres'),
  notes: z.string().optional(),
})

type LossFormValues = z.infer<typeof lossSchema>

export default function PerdasPage() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LossFormValues>({ resolver: zodResolver(lossSchema) })

  const onSubmit = async (data: LossFormValues) => {
    setSubmitting(true)
    try {
      // In production: await axios.post('/api/losses', data)
      await new Promise((r) => setTimeout(r, 800))
      setModalOpen(false)
      reset()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Perdas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Total do mês:{' '}
            <span className="font-semibold text-red-600">{formatCurrency(totalLoss)}</span>
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} variant="danger">
          <Plus className="h-4 w-4" />
          Registrar Perda
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryByType.map(({ type, total }) => (
          <Card key={type}>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium">{lossTypeLabel[type]}</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(total)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loss history table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Perdas</CardTitle>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" />
              Filtrar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Registrado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLosses.map((loss) => (
                <TableRow key={loss.id}>
                  <TableCell className="text-xs text-gray-500">
                    {formatDateTime(loss.reportedAt)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{loss.product.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{loss.product.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{loss.unit.name}</TableCell>
                  <TableCell>
                    <Badge variant={lossTypeVariant[loss.type]}>
                      {lossTypeLabel[loss.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-gray-700">
                    {loss.quantity} {loss.unitOfMeasure}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatCurrency(loss.totalCost)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 max-w-[180px] truncate">
                    {loss.reason}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{loss.user.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Register Loss Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Registrar Perda</ModalTitle>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Produto (ID)"
                {...register('productId')}
                error={errors.productId?.message}
                placeholder="ID do produto"
                required
              />
              <Input
                label="Unidade (ID)"
                {...register('unitId')}
                error={errors.unitId?.message}
                placeholder="ID da unidade"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Tipo de Perda <span className="text-red-500">*</span>
              </label>
              <Select onValueChange={(v) => setValue('type', v as LossType)}>
                <SelectTrigger error={errors.type?.message}>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(lossTypeLabel).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantidade"
                type="number"
                step="0.001"
                {...register('quantity')}
                error={errors.quantity?.message}
                required
              />
              <Input
                label="Custo Unitário (R$)"
                type="number"
                step="0.01"
                {...register('unitCost')}
                error={errors.unitCost?.message}
                required
              />
            </div>

            <Input
              label="Motivo"
              {...register('reason')}
              error={errors.reason?.message}
              placeholder="Descreva o motivo da perda"
              required
            />

            <Input
              label="Observações"
              {...register('notes')}
              placeholder="Informações adicionais (opcional)"
            />

            <ModalFooter className="mt-0">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="danger" loading={submitting}>
                Registrar Perda
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}
