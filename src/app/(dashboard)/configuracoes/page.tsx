'use client'

import * as React from 'react'
import { Plus, Building2, MapPin, Users, Truck, Tag, Settings } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BrandType, UserRole } from '@prisma/client'
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

// ─── Labels ──────────────────────────────────────────────────────────────────

const brandTypeLabel: Record<BrandType, string> = {
  TRADITIONAL_RESTAURANT: 'Restaurante Tradicional',
  BURGER: 'Hamburguer',
  PIZZA: 'Pizzaria',
  CAFE: 'Café',
  BAR: 'Bar',
  ASIAN: 'Asiático',
  FAST_FOOD: 'Fast Food',
  DARK_KITCHEN: 'Dark Kitchen',
}

const userRoleLabel: Record<UserRole, string> = {
  GROUP_ADMIN: 'Admin do Grupo',
  BRAND_ADMIN: 'Admin da Marca',
  UNIT_MANAGER: 'Gerente de Unidade',
  STOCK_KEEPER: 'Estoquista',
  BUYER: 'Comprador',
  FINANCIAL: 'Financeiro',
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockBrands = [
  { id: 'b1', name: 'Sabor da Casa', slug: 'sabor-da-casa', type: 'TRADITIONAL_RESTAURANT' as BrandType, active: true, units: 3 },
  { id: 'b2', name: 'Burger Palace', slug: 'burger-palace', type: 'BURGER' as BrandType, active: true, units: 2 },
  { id: 'b3', name: 'Pizza Planet', slug: 'pizza-planet', type: 'PIZZA' as BrandType, active: false, units: 1 },
]

const mockUnits = [
  { id: 'u1', name: 'Unidade Centro', code: 'CTR-01', brand: { name: 'Sabor da Casa' }, city: 'São Paulo', state: 'SP', active: true },
  { id: 'u2', name: 'Unidade Shopping', code: 'SHP-01', brand: { name: 'Sabor da Casa' }, city: 'São Paulo', state: 'SP', active: true },
  { id: 'u3', name: 'Burger Centro', code: 'BRG-01', brand: { name: 'Burger Palace' }, city: 'Campinas', state: 'SP', active: true },
]

const mockUsers = [
  { id: 'usr1', name: 'João Admin', email: 'joao@grupo.com', role: 'GROUP_ADMIN' as UserRole, active: true },
  { id: 'usr2', name: 'Carlos Souza', email: 'carlos@grupo.com', role: 'UNIT_MANAGER' as UserRole, active: true },
  { id: 'usr3', name: 'Ana Lima', email: 'ana@grupo.com', role: 'STOCK_KEEPER' as UserRole, active: true },
  { id: 'usr4', name: 'Marcos Buyer', email: 'marcos@grupo.com', role: 'BUYER' as UserRole, active: true },
]

const mockSuppliers = [
  { id: 's1', name: 'Distribuidora Alfa', cnpj: '12.345.678/0001-90', email: 'contato@alfa.com', phone: '(11) 9999-9999', active: true },
  { id: 's2', name: 'FrigorBom Ltda', cnpj: '98.765.432/0001-10', email: 'compras@frigorbom.com', phone: '(11) 8888-8888', active: true },
  { id: 's3', name: 'Laticínios Silva', cnpj: '55.555.555/0001-55', email: null, phone: '(19) 7777-7777', active: false },
]

const mockCategories = [
  { id: 'c1', name: 'Carnes', products: 8 },
  { id: 'c2', name: 'Peixes', products: 4 },
  { id: 'c3', name: 'Vegetais', products: 12 },
  { id: 'c4', name: 'Laticínios', products: 6 },
  { id: 'c5', name: 'Óleos e Gorduras', products: 3 },
  { id: 'c6', name: 'Grãos e Secos', products: 9 },
]

// ─── Schemas ─────────────────────────────────────────────────────────────────

const brandSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  slug: z.string().min(1, 'Slug obrigatório').regex(/^[a-z0-9-]+$/, 'Slug: apenas letras minúsculas, números e hífens'),
  type: z.nativeEnum(BrandType, { errorMap: () => ({ message: 'Tipo obrigatório' }) }),
})

const unitSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  code: z.string().min(1, 'Código obrigatório'),
  brandId: z.string().min(1, 'Marca obrigatória'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

const userSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Papel obrigatório' }) }),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

const supplierSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const categorySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
})

type BrandFormValues = z.infer<typeof brandSchema>
type UnitFormValues = z.infer<typeof unitSchema>
type UserFormValues = z.infer<typeof userSchema>
type SupplierFormValues = z.infer<typeof supplierSchema>
type CategoryFormValues = z.infer<typeof categorySchema>

// ─── Tab type ─────────────────────────────────────────────────────────────────

type Tab = 'marcas' | 'unidades' | 'usuarios' | 'fornecedores' | 'categorias' | 'parametros'

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'marcas', label: 'Marcas', icon: Building2 },
  { id: 'unidades', label: 'Unidades', icon: MapPin },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
  { id: 'categorias', label: 'Categorias', icon: Tag },
  { id: 'parametros', label: 'Parâmetros', icon: Settings },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('marcas')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  // Brand form
  const brandForm = useForm<BrandFormValues>({ resolver: zodResolver(brandSchema) })
  // Unit form
  const unitForm = useForm<UnitFormValues>({ resolver: zodResolver(unitSchema) })
  // User form
  const userForm = useForm<UserFormValues>({ resolver: zodResolver(userSchema) })
  // Supplier form
  const supplierForm = useForm<SupplierFormValues>({ resolver: zodResolver(supplierSchema) })
  // Category form
  const categoryForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) })

  const handleOpenModal = () => setModalOpen(true)
  const handleCloseModal = () => {
    setModalOpen(false)
    brandForm.reset()
    unitForm.reset()
    userForm.reset()
    supplierForm.reset()
    categoryForm.reset()
  }

  const handleSubmit = async (data: unknown) => {
    setSubmitting(true)
    const endpoints: Record<Tab, string> = {
      marcas: '/api/brands',
      unidades: '/api/units',
      usuarios: '/api/users',
      fornecedores: '/api/suppliers',
      categorias: '/api/categories',
      parametros: '',
    }
    try {
      if (endpoints[activeTab]) {
        await fetch(endpoints[activeTab], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }
      handleCloseModal()
    } catch {
      // graceful fallback
    } finally {
      setSubmitting(false)
    }
  }

  const addButtonLabel: Record<Tab, string> = {
    marcas: 'Nova Marca',
    unidades: 'Nova Unidade',
    usuarios: 'Novo Usuário',
    fornecedores: 'Novo Fornecedor',
    categorias: 'Nova Categoria',
    parametros: '',
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gerencie marcas, unidades, usuários e parâmetros do sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content header */}
      {activeTab !== 'parametros' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {activeTab === 'marcas' && `${mockBrands.length} marcas cadastradas`}
            {activeTab === 'unidades' && `${mockUnits.length} unidades cadastradas`}
            {activeTab === 'usuarios' && `${mockUsers.length} usuários cadastrados`}
            {activeTab === 'fornecedores' && `${mockSuppliers.length} fornecedores cadastrados`}
            {activeTab === 'categorias' && `${mockCategories.length} categorias cadastradas`}
          </p>
          <Button onClick={handleOpenModal}>
            <Plus className="h-4 w-4" />
            {addButtonLabel[activeTab]}
          </Button>
        </div>
      )}

      {/* Marcas */}
      {activeTab === 'marcas' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium text-gray-900">{brand.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {brand.slug}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{brandTypeLabel[brand.type]}</TableCell>
                  <TableCell className="text-right text-sm text-gray-600">{brand.units}</TableCell>
                  <TableCell>
                    <Badge variant={brand.active ? 'success' : 'neutral'}>
                      {brand.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Unidades */}
      {activeTab === 'unidades' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Cidade / Estado</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium text-gray-900">{unit.name}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                      {unit.code}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{unit.brand.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {unit.city && unit.state ? `${unit.city} / ${unit.state}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={unit.active ? 'success' : 'neutral'}>
                      {unit.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Usuários */}
      {activeTab === 'usuarios' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-gray-900">{user.name}</TableCell>
                  <TableCell className="text-sm text-gray-500">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{userRoleLabel[user.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.active ? 'success' : 'neutral'}>
                      {user.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Fornecedores */}
      {activeTab === 'fornecedores' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium text-gray-900">{supplier.name}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">{supplier.cnpj ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-500">{supplier.email ?? '—'}</TableCell>
                  <TableCell className="text-sm text-gray-500">{supplier.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.active ? 'success' : 'neutral'}>
                      {supplier.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Categorias */}
      {activeTab === 'categorias' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCategories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium text-gray-900">{cat.name}</TableCell>
                  <TableCell className="text-right text-sm text-gray-600">{cat.products}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Parâmetros */}
      {activeTab === 'parametros' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fuso horário padrão</span>
                <span className="font-medium text-gray-900">America/Sao_Paulo</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Moeda</span>
                <span className="font-medium text-gray-900">BRL (R$)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Método de custo</span>
                <span className="font-medium text-gray-900">Custo Médio Ponderado</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Método de baixa</span>
                <span className="font-medium text-gray-900">FIFO</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Alerta de baixo estoque</span>
                <span className="font-medium text-gray-900">Habilitado</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Alerta de vencimento</span>
                <span className="font-medium text-gray-900">7 dias de antecedência</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Alerta de perdas elevadas</span>
                <span className="font-medium text-gray-900">Habilitado</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal for Marcas */}
      {activeTab === 'marcas' && (
        <Modal open={modalOpen} onOpenChange={setModalOpen}>
          <ModalContent size="md">
            <ModalHeader><ModalTitle>Nova Marca</ModalTitle></ModalHeader>
            <form onSubmit={brandForm.handleSubmit(handleSubmit)} className="space-y-4">
              <Input
                label="Nome"
                {...brandForm.register('name')}
                error={brandForm.formState.errors.name?.message}
                required
              />
              <Input
                label="Slug"
                {...brandForm.register('slug')}
                error={brandForm.formState.errors.slug?.message}
                placeholder="Ex: minha-marca"
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Tipo <span className="text-red-500">*</span></label>
                <Select onValueChange={(v) => brandForm.setValue('type', v as BrandType)}>
                  <SelectTrigger error={brandForm.formState.errors.type?.message}>
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(brandTypeLabel).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {brandForm.formState.errors.type && (
                  <p className="text-xs text-red-600">{brandForm.formState.errors.type.message}</p>
                )}
              </div>
              <ModalFooter className="mt-0">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" loading={submitting}>Criar Marca</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Modal for Unidades */}
      {activeTab === 'unidades' && (
        <Modal open={modalOpen} onOpenChange={setModalOpen}>
          <ModalContent size="md">
            <ModalHeader><ModalTitle>Nova Unidade</ModalTitle></ModalHeader>
            <form onSubmit={unitForm.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nome"
                  {...unitForm.register('name')}
                  error={unitForm.formState.errors.name?.message}
                  required
                />
                <Input
                  label="Código"
                  {...unitForm.register('code')}
                  error={unitForm.formState.errors.code?.message}
                  placeholder="Ex: CTR-01"
                  required
                />
              </div>
              <Input
                label="Marca (ID)"
                {...unitForm.register('brandId')}
                error={unitForm.formState.errors.brandId?.message}
                placeholder="ID da marca"
                required
              />
              <Input
                label="Endereço"
                {...unitForm.register('address')}
                placeholder="Opcional"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cidade"
                  {...unitForm.register('city')}
                  placeholder="Opcional"
                />
                <Input
                  label="Estado"
                  {...unitForm.register('state')}
                  placeholder="Ex: SP"
                />
              </div>
              <ModalFooter className="mt-0">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" loading={submitting}>Criar Unidade</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Modal for Usuários */}
      {activeTab === 'usuarios' && (
        <Modal open={modalOpen} onOpenChange={setModalOpen}>
          <ModalContent size="md">
            <ModalHeader><ModalTitle>Novo Usuário</ModalTitle></ModalHeader>
            <form onSubmit={userForm.handleSubmit(handleSubmit)} className="space-y-4">
              <Input
                label="Nome"
                {...userForm.register('name')}
                error={userForm.formState.errors.name?.message}
                required
              />
              <Input
                label="E-mail"
                type="email"
                {...userForm.register('email')}
                error={userForm.formState.errors.email?.message}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Papel <span className="text-red-500">*</span></label>
                <Select onValueChange={(v) => userForm.setValue('role', v as UserRole)}>
                  <SelectTrigger error={userForm.formState.errors.role?.message}>
                    <SelectValue placeholder="Selecione o papel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(userRoleLabel).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {userForm.formState.errors.role && (
                  <p className="text-xs text-red-600">{userForm.formState.errors.role.message}</p>
                )}
              </div>
              <Input
                label="Senha"
                type="password"
                {...userForm.register('password')}
                error={userForm.formState.errors.password?.message}
                required
              />
              <ModalFooter className="mt-0">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" loading={submitting}>Criar Usuário</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Modal for Fornecedores */}
      {activeTab === 'fornecedores' && (
        <Modal open={modalOpen} onOpenChange={setModalOpen}>
          <ModalContent size="md">
            <ModalHeader><ModalTitle>Novo Fornecedor</ModalTitle></ModalHeader>
            <form onSubmit={supplierForm.handleSubmit(handleSubmit)} className="space-y-4">
              <Input
                label="Nome"
                {...supplierForm.register('name')}
                error={supplierForm.formState.errors.name?.message}
                required
              />
              <Input
                label="CNPJ"
                {...supplierForm.register('cnpj')}
                placeholder="Opcional"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  {...supplierForm.register('email')}
                  error={supplierForm.formState.errors.email?.message}
                  placeholder="Opcional"
                />
                <Input
                  label="Telefone"
                  {...supplierForm.register('phone')}
                  placeholder="Opcional"
                />
              </div>
              <Input
                label="Endereço"
                {...supplierForm.register('address')}
                placeholder="Opcional"
              />
              <ModalFooter className="mt-0">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" loading={submitting}>Criar Fornecedor</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Modal for Categorias */}
      {activeTab === 'categorias' && (
        <Modal open={modalOpen} onOpenChange={setModalOpen}>
          <ModalContent size="sm">
            <ModalHeader><ModalTitle>Nova Categoria</ModalTitle></ModalHeader>
            <form onSubmit={categoryForm.handleSubmit(handleSubmit)} className="space-y-4">
              <Input
                label="Nome"
                {...categoryForm.register('name')}
                error={categoryForm.formState.errors.name?.message}
                required
              />
              <ModalFooter className="mt-0">
                <Button type="button" variant="outline" onClick={handleCloseModal}>Cancelar</Button>
                <Button type="submit" loading={submitting}>Criar Categoria</Button>
              </ModalFooter>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  )
}
