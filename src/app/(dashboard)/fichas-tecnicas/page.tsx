'use client'

import * as React from 'react'
import { Plus, Search, Clock, ChefHat } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UOM } from '@prisma/client'
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
import { formatCurrency } from '@/lib/utils'

const uomLabels: Record<UOM, string> = {
  KG: 'kg', G: 'g', L: 'L', ML: 'mL', UN: 'un', CX: 'cx', PCT: 'pct', SC: 'sc', BD: 'bd',
}

const mockSheets = [
  {
    id: 'ts1',
    name: 'Filé de Frango Grelhado',
    unit: { name: 'Unidade Centro' },
    yield: 1,
    yieldUnit: 'UN' as UOM,
    preparationTime: 25,
    cost: 12.5,
    active: true,
    ingredients: [
      { product: { name: 'Frango Inteiro' }, quantity: 0.2, unitOfMeasure: 'KG' as UOM },
      { product: { name: 'Azeite Extra Virgem' }, quantity: 0.02, unitOfMeasure: 'L' as UOM },
    ],
  },
  {
    id: 'ts2',
    name: 'Molho Pomodoro',
    unit: { name: 'Unidade Centro' },
    yield: 1,
    yieldUnit: 'L' as UOM,
    preparationTime: 40,
    cost: 8.75,
    active: true,
    ingredients: [
      { product: { name: 'Tomate Italiano' }, quantity: 1.5, unitOfMeasure: 'KG' as UOM },
      { product: { name: 'Azeite Extra Virgem' }, quantity: 0.05, unitOfMeasure: 'L' as UOM },
    ],
  },
  {
    id: 'ts3',
    name: 'Massa Fresca para Macarrão',
    unit: { name: 'Unidade Shopping' },
    yield: 4,
    yieldUnit: 'UN' as UOM,
    preparationTime: 60,
    cost: 6.2,
    active: true,
    ingredients: [
      { product: { name: 'Farinha de Trigo' }, quantity: 0.5, unitOfMeasure: 'KG' as UOM },
      { product: { name: 'Ovo' }, quantity: 3, unitOfMeasure: 'UN' as UOM },
    ],
  },
  {
    id: 'ts4',
    name: 'Sobremesa de Creme',
    unit: { name: 'Unidade Shopping' },
    yield: 6,
    yieldUnit: 'UN' as UOM,
    preparationTime: 90,
    cost: 14.0,
    active: false,
    ingredients: [
      { product: { name: 'Creme de Leite' }, quantity: 0.4, unitOfMeasure: 'L' as UOM },
      { product: { name: 'Açúcar Cristal' }, quantity: 0.12, unitOfMeasure: 'KG' as UOM },
    ],
  },
]

const ingredientSchema = z.object({
  productId: z.string().min(1, 'Produto obrigatório'),
  quantity: z.coerce.number().positive('Quantidade deve ser positiva'),
  unitOfMeasure: z.nativeEnum(UOM, { errorMap: () => ({ message: 'Unidade obrigatória' }) }),
  wasteFactor: z.coerce.number().min(0).max(1).default(0),
})

const sheetSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  unitId: z.string().min(1, 'Unidade obrigatória'),
  yield: z.coerce.number().positive('Rendimento deve ser positivo'),
  yieldUnit: z.nativeEnum(UOM, { errorMap: () => ({ message: 'Unidade obrigatória' }) }),
  preparationTime: z.coerce.number().int().positive().optional(),
  description: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1, 'Adicione pelo menos um ingrediente'),
})

type SheetFormValues = z.infer<typeof sheetSchema>

export default function FichasTecnicasPage() {
  const [search, setSearch] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const filtered = mockSheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<SheetFormValues>({
    resolver: zodResolver(sheetSchema),
    defaultValues: { ingredients: [{ productId: '', quantity: 0, unitOfMeasure: 'KG', wasteFactor: 0 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  const onSubmit = async (data: SheetFormValues) => {
    setSubmitting(true)
    try {
      await fetch('/api/technical-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setModalOpen(false)
      reset()
    } catch {
      // graceful fallback
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fichas Técnicas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} receitas cadastradas</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Ficha
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar ficha técnica..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Rendimento</TableHead>
              <TableHead>Ingredientes</TableHead>
              <TableHead>Tempo Prep.</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sheet) => (
              <TableRow key={sheet.id} className="cursor-pointer">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900">{sheet.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{sheet.unit.name}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {sheet.yield} {uomLabels[sheet.yieldUnit]}
                </TableCell>
                <TableCell>
                  <Badge variant="neutral">{sheet.ingredients.length} ingrediente(s)</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {sheet.preparationTime ? (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {sheet.preparationTime} min
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold text-gray-900">
                  {formatCurrency(sheet.cost)}
                </TableCell>
                <TableCell>
                  <Badge variant={sheet.active ? 'success' : 'neutral'}>
                    {sheet.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* New Technical Sheet Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Nova Ficha Técnica</ModalTitle>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nome da Receita"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Ex: Filé ao molho"
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

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Rendimento"
                type="number"
                step="0.01"
                {...register('yield')}
                error={errors.yield?.message}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Unidade de Rendimento <span className="text-red-500">*</span>
                </label>
                <Select onValueChange={(v) => setValue('yieldUnit', v as UOM)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(uomLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                label="Tempo de Preparo (min)"
                type="number"
                {...register('preparationTime')}
                error={errors.preparationTime?.message}
                placeholder="Opcional"
              />
            </div>

            <Input
              label="Descrição"
              {...register('description')}
              placeholder="Descrição da receita (opcional)"
            />

            {/* Ingredients */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Ingredientes <span className="text-red-500">*</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: '', quantity: 0, unitOfMeasure: 'KG' as UOM, wasteFactor: 0 })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                    <Input
                      label={index === 0 ? 'Produto (ID)' : undefined}
                      {...register(`ingredients.${index}.productId`)}
                      error={errors.ingredients?.[index]?.productId?.message}
                      placeholder="ID do produto"
                    />
                    <div className="w-24">
                      {index === 0 && <label className="text-sm font-medium text-gray-700 block mb-1">Qtd</label>}
                      <Input
                        type="number"
                        step="0.001"
                        {...register(`ingredients.${index}.quantity`)}
                        error={errors.ingredients?.[index]?.quantity?.message}
                        placeholder="Qtd"
                      />
                    </div>
                    <div className="w-20">
                      {index === 0 && <label className="text-sm font-medium text-gray-700 block mb-1">Un.</label>}
                      <Select
                        defaultValue="KG"
                        onValueChange={(v) => setValue(`ingredients.${index}.unitOfMeasure`, v as UOM)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(uomLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                      className={index === 0 ? 'self-end' : ''}
                      disabled={fields.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
              {errors.ingredients?.root && (
                <p className="text-xs text-red-600 mt-1">{errors.ingredients.root.message}</p>
              )}
            </div>

            <ModalFooter className="mt-0 sticky bottom-0 bg-white pt-2">
              <Button type="button" variant="outline" onClick={() => { setModalOpen(false); reset() }}>
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                Criar Ficha
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  )
}
