'use client'

import * as React from 'react'
import { Search, Plus, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { ProductForm } from '@/components/products/ProductForm'
import { CreateProductDTO, UOM } from '@/types'
import axios from 'axios'

const uomLabels: Record<string, string> = {
  KG: 'kg', G: 'g', L: 'L', ML: 'mL', UN: 'un', CX: 'cx', PCT: 'pct', SC: 'sc', BD: 'bd',
}

// Mock data for demo
const mockProducts = [
  { id: '1', sku: 'FRG-001', internalCode: 'A001', name: 'Frango Inteiro', category: { name: 'Carnes' }, unitOfMeasure: 'KG' as UOM, minStock: 20, idealStock: 50, active: true },
  { id: '2', sku: 'SAL-001', internalCode: 'A002', name: 'Salmão Fresco', category: { name: 'Peixes' }, unitOfMeasure: 'KG' as UOM, minStock: 5, idealStock: 15, active: true },
  { id: '3', sku: 'TMT-001', internalCode: 'V001', name: 'Tomate Italiano', category: { name: 'Vegetais' }, unitOfMeasure: 'KG' as UOM, minStock: 10, idealStock: 30, active: true },
  { id: '4', sku: 'QMN-001', internalCode: 'L001', name: 'Queijo Minas Frescal', category: { name: 'Laticínios' }, unitOfMeasure: 'KG' as UOM, minStock: 3, idealStock: 10, active: true },
  { id: '5', sku: 'AZT-001', internalCode: 'O001', name: 'Azeite Extra Virgem', category: { name: 'Óleos' }, unitOfMeasure: 'L' as UOM, minStock: 5, idealStock: 20, active: true },
  { id: '6', sku: 'FRN-001', internalCode: 'G001', name: 'Farinha de Trigo', category: { name: 'Grãos' }, unitOfMeasure: 'KG' as UOM, minStock: 25, idealStock: 80, active: true },
  { id: '7', sku: 'ACU-001', internalCode: 'G002', name: 'Açúcar Cristal', category: { name: 'Grãos' }, unitOfMeasure: 'KG' as UOM, minStock: 10, idealStock: 40, active: false },
]

const mockCategories = [
  { id: 'c1', name: 'Carnes' },
  { id: 'c2', name: 'Peixes' },
  { id: 'c3', name: 'Vegetais' },
  { id: 'c4', name: 'Laticínios' },
  { id: 'c5', name: 'Óleos' },
  { id: 'c6', name: 'Grãos' },
]

export default function ProdutosPage() {
  const [search, setSearch] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const filtered = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreateProduct = async (data: CreateProductDTO) => {
    setSubmitting(true)
    setError(null)
    try {
      await axios.post('/api/products', data)
      setModalOpen(false)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Erro ao criar produto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} produtos cadastrados</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
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
        <Button variant="outline" size="md">
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Estoque Mín.</TableHead>
              <TableHead className="text-right">Estoque Ideal</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => (
              <TableRow key={product.id} className="cursor-pointer">
                <TableCell>
                  <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    {product.sku}
                  </span>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.internalCode && (
                      <p className="text-xs text-gray-400">{product.internalCode}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{product.category.name}</TableCell>
                <TableCell>
                  <Badge variant="neutral">{uomLabels[product.unitOfMeasure]}</Badge>
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {product.minStock} {uomLabels[product.unitOfMeasure]}
                </TableCell>
                <TableCell className="text-right text-gray-600">
                  {product.idealStock} {uomLabels[product.unitOfMeasure]}
                </TableCell>
                <TableCell>
                  <Badge variant={product.active ? 'success' : 'neutral'}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create Product Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent size="lg">
          <ModalHeader>
            <ModalTitle>Novo Produto</ModalTitle>
          </ModalHeader>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          <ProductForm
            groupId="group-1"
            categories={mockCategories}
            onSubmit={handleCreateProduct}
            onCancel={() => setModalOpen(false)}
            loading={submitting}
          />
        </ModalContent>
      </Modal>
    </div>
  )
}
