'use client'

import * as React from 'react'
import { Plus, ShoppingCart, ClipboardList } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PRStatus, UOM } from '@prisma/client'
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

const prStatusLabel: Record<PRStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING_APPROVAL: 'Aguardando Aprovação',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CONVERTED: 'Convertido',
}

const prStatusVariant: Record<PRStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  CONVERTED: 'neutral',
}

const uomLabels: Record<UOM, string> = {
  KG: 'kg', G: 'g', L: 'L', ML: 'mL', UN: 'un', CX: 'cx', PCT: 'pct', SC: 'sc', BD: 'bd',
}

const mockRequests = [
  {
    id: 'pr1',
    unit: { name: 'Unidade Centro' },
    requestedBy: { name: 'Carlos Souza' },
    status: 'PENDING_APPROVAL' as PRStatus,
    notes: 'Reposição semanal de carnes',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    items: [
      { product: { name: 'Frango Inteiro', sku: 'FRG-001' }, quantity: 20, unitOfMeasure: 'KG' as UOM, estimatedCost: 370 },
      { product: { name: 'Alcatra', sku: 'ALC-001' }, quantity: 10, unitOfMeasure: 'KG' as UOM, estimatedCost: 350 },
    ],
  },
  {
    id: 'pr2',
    unit: { name: 'Unidade Shopping' },
    requestedBy: { name: 'Ana Lima' },
    status: 'APPROVED' as PRStatus,
    notes: 'Insumos de padaria',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    items: [
      { product: { name: 'Farinha de Trigo', sku: 'FRN-001' }, quantity: 50, unitOfMeasure: 'KG' as UOM, estimatedCost: 125 },
    ],
  },
  {
    id: 'pr3',
    unit: { name: 'Unidade Norte' },
    requestedBy: { name: 'Pedro Santos' },
    status: 'DRAFT' as PRStatus,
    notes: null,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    items: [],
  },
]

const mockOrders = [
  {
    id: 'po1',
    unit: { name: 'Unidade Centro' },
    supplier: { name: 'Distribuidora ABC' },
    createdBy: { name: 'Carlos Souza' },
    status: 'SENT',
    totalAmount: 1250,
    expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 'po2',
    unit: { name: 'Unidade Shopping' },
    supplier: { name: 'Laticínios Silva' },
    createdBy: { name: 'Ana Lima' },
    status: 'RECEIVED',
    totalAmount: 480,
    expectedDelivery: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
]

const requestSchema = z.object({
  unitId: z.string().min(1, 'Unidade obrigatória'),
  notes: z.string().optional(),
  productId: z.string().min(1, 'Produto obrigatório'),
  quantity: z.coerce.number().positive('Quantidade deve ser positiva'),
  unitOfMeasure: z.nativeEnum(UOM, { errorMap: () => ({ message: 'Unidade obrigatória' }) }),
  estimatedCost: z.coerce.number().min(0).optional(),
})

type RequestFormValues = z.infer<typeof requestSchema>

export default function ComprasPage() {
  const [activeTab, setActiveTab] = React.useState<'requests' | 'orders'>('requests')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({ resolver: zodResolver(requestSchema) })

  const onSubmit = async (data: RequestFormValues) => {
    setSubmitting(true)
    try {
      // await axios.post('/api/purchase-requests', { unitId: data.unitId, notes: data.notes, items: [{ productId: data.productId, quantity: data.quantity, unitOfMeasure: data.unitOfMeasure, estimatedCost: data.estimatedCost }] })
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
          <h1 className="text-xl font-bold text-gray-900">Compras</h1>
          <p className="text-sm text-gray-500 mt-0.5">Solicitações e pedidos de compra</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'requests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Solicitações
          <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {mockRequests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          Pedidos
          <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {mockOrders.length}
          </span>
        </button>
      </div>

      {/* Solicitações Tab */}
      {activeTab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Compra</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRequests.map((req) => (
                  <TableRow key={req.id} className="cursor-pointer">
                    <TableCell>
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {req.id.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700">{req.unit.name}</TableCell>
                    <TableCell className="text-gray-700">{req.requestedBy.name}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{req.items.length} produto(s)</TableCell>
                    <TableCell>
                      <Badge variant={prStatusVariant[req.status]}>{prStatusLabel[req.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDate(req.createdAt)}</TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[160px] truncate">
                      {req.notes || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pedidos Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <CardTitle>Pedidos de Compra</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Criado por</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrders.map((order) => (
                  <TableRow key={order.id} className="cursor-pointer">
                    <TableCell>
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {order.id.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-700">{order.unit.name}</TableCell>
                    <TableCell className="text-gray-700">{order.supplier.name}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{order.createdBy.name}</TableCell>
                    <TableCell className="text-right font-semibold text-gray-800">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">{formatDate(order.expectedDelivery)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'RECEIVED' ? 'success' : order.status === 'CANCELLED' ? 'danger' : 'warning'}>
                        {order.status === 'SENT' ? 'Enviado' : order.status === 'RECEIVED' ? 'Recebido' : order.status === 'DRAFT' ? 'Rascunho' : order.status === 'PARTIAL_RECEIVED' ? 'Parcial' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* New Request Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Nova Solicitação de Compra</ModalTitle>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Unidade (ID)"
                {...register('unitId')}
                error={errors.unitId?.message}
                placeholder="ID da unidade"
                required
              />
              <Input
                label="Produto (ID)"
                {...register('productId')}
                error={errors.productId?.message}
                placeholder="ID do produto"
                required
              />
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
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Unidade de Medida <span className="text-red-500">*</span>
                </label>
                <Select onValueChange={(v) => setValue('unitOfMeasure', v as UOM)}>
                  <SelectTrigger error={errors.unitOfMeasure?.message}>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(uomLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unitOfMeasure && <p className="text-xs text-red-600">{errors.unitOfMeasure.message}</p>}
              </div>
            </div>

            <Input
              label="Custo Estimado (R$)"
              type="number"
              step="0.01"
              {...register('estimatedCost')}
              error={errors.estimatedCost?.message}
              placeholder="Opcional"
            />

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
                Criar Solicitação
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}
