'use client'

import * as React from 'react'
import { Plus, ClipboardCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CountType, CountStatus } from '@prisma/client'
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
import { formatCurrency, formatDate } from '@/lib/utils'

const countTypeLabel: Record<CountType, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  ANNUAL: 'Anual',
}

const countStatusLabel: Record<CountStatus, string> = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em Andamento',
  FINISHED: 'Finalizada',
  APPROVED: 'Aprovada',
}

const countStatusVariant: Record<CountStatus, 'neutral' | 'warning' | 'success'> = {
  DRAFT: 'neutral',
  IN_PROGRESS: 'warning',
  FINISHED: 'neutral',
  APPROVED: 'success',
}

const mockCounts = [
  {
    id: 'ic1',
    unit: { name: 'Unidade Centro' },
    createdBy: { name: 'Carlos Souza' },
    type: 'WEEKLY' as CountType,
    status: 'IN_PROGRESS' as CountStatus,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    finishedAt: null,
    notes: 'Contagem semanal de proteínas',
    _count: { items: 12 },
    divergenceValue: -145.5,
  },
  {
    id: 'ic2',
    unit: { name: 'Unidade Shopping' },
    createdBy: { name: 'Ana Lima' },
    type: 'MONTHLY' as CountType,
    status: 'APPROVED' as CountStatus,
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    notes: null,
    _count: { items: 45 },
    divergenceValue: -320,
  },
  {
    id: 'ic3',
    unit: { name: 'Unidade Norte' },
    createdBy: { name: 'Pedro Santos' },
    type: 'DAILY' as CountType,
    status: 'FINISHED' as CountStatus,
    startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    finishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    notes: 'Contagem de fechamento',
    _count: { items: 8 },
    divergenceValue: 0,
  },
]

const countSchema = z.object({
  unitId: z.string().min(1, 'Unidade obrigatória'),
  type: z.nativeEnum(CountType, { errorMap: () => ({ message: 'Tipo obrigatório' }) }),
  notes: z.string().optional(),
})

type CountFormValues = z.infer<typeof countSchema>

export default function InventarioPage() {
  const [modalOpen, setModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CountFormValues>({ resolver: zodResolver(countSchema) })

  const onSubmit = async (data: CountFormValues) => {
    setSubmitting(true)
    try {
      // await axios.post('/api/inventory-counts', data)
      await new Promise((r) => setTimeout(r, 600))
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
          <h1 className="text-xl font-bold text-gray-900">Inventário</h1>
          <p className="text-sm text-gray-500 mt-0.5">Contagens físicas de estoque</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Iniciar Contagem
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['DRAFT', 'IN_PROGRESS', 'FINISHED', 'APPROVED'] as CountStatus[]).map((status) => {
          const count = mockCounts.filter((c) => c.status === status).length
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">{countStatusLabel[status]}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Counts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Contagens</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Iniciada em</TableHead>
                <TableHead>Finalizada em</TableHead>
                <TableHead className="text-right">Divergência (R$)</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCounts.map((count) => (
                <TableRow key={count.id} className="cursor-pointer">
                  <TableCell>
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {count.id.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700">{count.unit.name}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{countTypeLabel[count.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    <span className="flex items-center gap-1">
                      <ClipboardCheck className="h-3.5 w-3.5 text-gray-400" />
                      {count._count.items}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={countStatusVariant[count.status]}>{countStatusLabel[count.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(count.startedAt)}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {count.finishedAt ? formatDate(count.finishedAt) : '—'}
                  </TableCell>
                  <TableCell className={`text-right font-semibold text-sm ${count.divergenceValue < 0 ? 'text-red-600' : count.divergenceValue > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    {count.divergenceValue !== 0 ? formatCurrency(count.divergenceValue) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{count.createdBy.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Count Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent size="md">
          <ModalHeader>
            <ModalTitle>Iniciar Nova Contagem</ModalTitle>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Unidade (ID)"
              {...register('unitId')}
              error={errors.unitId?.message}
              placeholder="ID da unidade"
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Tipo de Contagem <span className="text-red-500">*</span>
              </label>
              <Select onValueChange={(v) => setValue('type', v as CountType)}>
                <SelectTrigger error={errors.type?.message}>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(countTypeLabel).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
            </div>

            <Input
              label="Observações"
              {...register('notes')}
              placeholder="Notas adicionais (opcional)"
            />

            <ModalFooter className="mt-0">
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); reset() }}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Iniciar Contagem
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}
