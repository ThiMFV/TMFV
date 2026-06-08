'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UOM } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreateProductDTO } from '@/types'

const productSchema = z.object({
  sku: z.string().min(1, 'SKU obrigatório'),
  internalCode: z.string().optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  unitOfMeasure: z.nativeEnum(UOM, { errorMap: () => ({ message: 'Unidade obrigatória' }) }),
  groupId: z.string().min(1),
  brandId: z.string().optional(),
  weight: z.coerce.number().positive().optional().or(z.literal('')),
  volume: z.coerce.number().positive().optional().or(z.literal('')),
  minStock: z.coerce.number().min(0).default(0),
  idealStock: z.coerce.number().min(0).default(0),
  shelfLifeDays: z.coerce.number().int().positive().optional().or(z.literal('')),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>
  groupId: string
  categories: { id: string; name: string }[]
  onSubmit: (data: CreateProductDTO) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

const uomOptions: { value: UOM; label: string }[] = [
  { value: 'KG', label: 'Quilograma (kg)' },
  { value: 'G', label: 'Grama (g)' },
  { value: 'L', label: 'Litro (L)' },
  { value: 'ML', label: 'Mililitro (mL)' },
  { value: 'UN', label: 'Unidade (un)' },
  { value: 'CX', label: 'Caixa (cx)' },
  { value: 'PCT', label: 'Pacote (pct)' },
  { value: 'SC', label: 'Saco (sc)' },
  { value: 'BD', label: 'Bandeja (bd)' },
]

export function ProductForm({
  defaultValues,
  groupId,
  categories,
  onSubmit,
  onCancel,
  loading,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      groupId,
      minStock: 0,
      idealStock: 0,
      ...defaultValues,
    },
  })

  const handleFormSubmit = async (data: ProductFormValues) => {
    await onSubmit({
      ...data,
      weight: data.weight ? Number(data.weight) : undefined,
      volume: data.volume ? Number(data.volume) : undefined,
      shelfLifeDays: data.shelfLifeDays ? Number(data.shelfLifeDays) : undefined,
    } as CreateProductDTO)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="SKU"
          {...register('sku')}
          error={errors.sku?.message}
          required
          placeholder="ex: FRG-001"
        />
        <Input
          label="Código Interno"
          {...register('internalCode')}
          error={errors.internalCode?.message}
          placeholder="Opcional"
        />
      </div>

      <Input
        label="Nome do Produto"
        {...register('name')}
        error={errors.name?.message}
        required
        placeholder="ex: Frango Inteiro"
      />

      <Input
        label="Descrição"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Opcional"
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Categoria <span className="text-red-500">*</span>
          </label>
          <Select
            onValueChange={(v) => setValue('categoryId', v)}
            defaultValue={defaultValues?.categoryId}
          >
            <SelectTrigger error={errors.categoryId?.message}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-xs text-red-600">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Unidade de Medida <span className="text-red-500">*</span>
          </label>
          <Select
            onValueChange={(v) => setValue('unitOfMeasure', v as UOM)}
            defaultValue={defaultValues?.unitOfMeasure}
          >
            <SelectTrigger error={errors.unitOfMeasure?.message}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {uomOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unitOfMeasure && (
            <p className="text-xs text-red-600">{errors.unitOfMeasure.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Estoque Mínimo"
          type="number"
          step="0.01"
          {...register('minStock')}
          error={errors.minStock?.message}
        />
        <Input
          label="Estoque Ideal"
          type="number"
          step="0.01"
          {...register('idealStock')}
          error={errors.idealStock?.message}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Peso (kg)"
          type="number"
          step="0.001"
          {...register('weight')}
          error={errors.weight?.message}
          placeholder="Opcional"
        />
        <Input
          label="Volume (L)"
          type="number"
          step="0.001"
          {...register('volume')}
          error={errors.volume?.message}
          placeholder="Opcional"
        />
        <Input
          label="Validade (dias)"
          type="number"
          {...register('shelfLifeDays')}
          error={errors.shelfLifeDays?.message}
          placeholder="Opcional"
        />
      </div>

      <input type="hidden" {...register('groupId')} />

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={loading}>
          Salvar Produto
        </Button>
      </div>
    </form>
  )
}
