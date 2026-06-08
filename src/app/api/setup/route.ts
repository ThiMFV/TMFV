import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db/prisma'
import { BrandType, UOM, UserRole } from '@prisma/client'

async function runSetup() {
  const existingGroup = await prisma.group.findFirst()
  if (existingGroup) {
    return { message: 'Setup já foi executado anteriormente.', alreadyDone: true }
  }

  const grupo = await prisma.group.create({
    data: { name: 'Grupo Gourmet', slug: 'grupo-gourmet' },
  })

  const marcaBurger = await prisma.brand.create({
    data: { groupId: grupo.id, name: 'Smash Burger', slug: 'smash-burger', type: BrandType.BURGER },
  })
  const marcaPizza = await prisma.brand.create({
    data: { groupId: grupo.id, name: 'La Pizza', slug: 'la-pizza', type: BrandType.PIZZA },
  })
  const marcaCafe = await prisma.brand.create({
    data: { groupId: grupo.id, name: 'Café Verde', slug: 'cafe-verde', type: BrandType.CAFE },
  })

  const unidadeBurger1 = await prisma.unit.create({
    data: { brandId: marcaBurger.id, name: 'Smash Burger - Vila Madalena', code: 'SB-001', city: 'São Paulo', state: 'SP' },
  })
  await prisma.unit.create({ data: { brandId: marcaBurger.id, name: 'Smash Burger - Pinheiros', code: 'SB-002', city: 'São Paulo', state: 'SP' } })
  await prisma.unit.create({ data: { brandId: marcaPizza.id, name: 'La Pizza - Moema', code: 'LP-001', city: 'São Paulo', state: 'SP' } })
  await prisma.unit.create({ data: { brandId: marcaCafe.id, name: 'Café Verde - Jardins', code: 'CV-001', city: 'São Paulo', state: 'SP' } })

  const senhaAdmin = await bcrypt.hash('Admin@123', 10)
  const senhaGerente = await bcrypt.hash('Gerente@123', 10)
  const senhaEstoque = await bcrypt.hash('Estoque@123', 10)

  await prisma.user.create({ data: { email: 'admin@grupogourmet.com.br', passwordHash: senhaAdmin, name: 'Administrador Grupo', role: UserRole.GROUP_ADMIN, groupId: grupo.id } })
  await prisma.user.create({ data: { email: 'gerente.burger@grupogourmet.com.br', passwordHash: senhaGerente, name: 'Gerente - Smash Burger', role: UserRole.BRAND_ADMIN, groupId: grupo.id, brandId: marcaBurger.id } })
  await prisma.user.create({ data: { email: 'estoquista.sb001@grupogourmet.com.br', passwordHash: senhaEstoque, name: 'Estoquista - Vila Madalena', role: UserRole.STOCK_KEEPER, groupId: grupo.id, brandId: marcaBurger.id, unitId: unidadeBurger1.id } })

  const fornecedor = await prisma.supplier.create({
    data: { name: 'Frigorífico São Paulo', cnpj: '12.345.678/0001-90', email: 'vendas@frigorifico-sp.com.br', groupId: grupo.id },
  })

  const catCarnes = await prisma.category.create({ data: { name: 'Carnes', groupId: grupo.id } })
  const catPaes = await prisma.category.create({ data: { name: 'Pães e Massas', groupId: grupo.id } })
  const catLaticinios = await prisma.category.create({ data: { name: 'Laticínios', groupId: grupo.id } })
  const catHortifruti = await prisma.category.create({ data: { name: 'Hortifruti', groupId: grupo.id } })
  const catBebidas = await prisma.category.create({ data: { name: 'Bebidas', groupId: grupo.id } })
  const catDescartaveis = await prisma.category.create({ data: { name: 'Descartáveis', groupId: grupo.id } })

  const produtos = [
    { sku: 'CARNE-180G', name: 'Carne Bovina Moída 180g', categoryId: catCarnes.id, unitOfMeasure: UOM.KG, minStock: 10, idealStock: 50, shelfLifeDays: 3 },
    { sku: 'PAO-BRIOCHE', name: 'Pão Brioche para Hambúrguer', categoryId: catPaes.id, unitOfMeasure: UOM.UN, minStock: 50, idealStock: 200, shelfLifeDays: 5 },
    { sku: 'QUEIJO-CHED', name: 'Queijo Cheddar Fatiado', categoryId: catLaticinios.id, unitOfMeasure: UOM.KG, minStock: 2, idealStock: 10, shelfLifeDays: 14 },
    { sku: 'ALFACE-CRE', name: 'Alface Crespa', categoryId: catHortifruti.id, unitOfMeasure: UOM.KG, minStock: 2, idealStock: 8, shelfLifeDays: 3 },
    { sku: 'TOMATE-ITA', name: 'Tomate Italiano', categoryId: catHortifruti.id, unitOfMeasure: UOM.KG, minStock: 2, idealStock: 10, shelfLifeDays: 5 },
    { sku: 'BACON-FATI', name: 'Bacon Fatiado', categoryId: catCarnes.id, unitOfMeasure: UOM.KG, minStock: 2, idealStock: 8, shelfLifeDays: 7 },
    { sku: 'MOLHO-ESP', name: 'Molho Especial da Casa', categoryId: catLaticinios.id, unitOfMeasure: UOM.L, minStock: 1, idealStock: 5, shelfLifeDays: 7 },
    { sku: 'REFRI-350', name: 'Refrigerante Lata 350ml', categoryId: catBebidas.id, unitOfMeasure: UOM.UN, minStock: 24, idealStock: 120, shelfLifeDays: 180 },
    { sku: 'AGUA-500', name: 'Água Mineral 500ml', categoryId: catBebidas.id, unitOfMeasure: UOM.UN, minStock: 12, idealStock: 60, shelfLifeDays: 365 },
    { sku: 'EMBAL-BURG', name: 'Embalagem Hambúrguer', categoryId: catDescartaveis.id, unitOfMeasure: UOM.UN, minStock: 100, idealStock: 500 },
  ]

  const produtosCriados: Record<string, string> = {}
  for (const p of produtos) {
    const prod = await prisma.product.create({ data: { ...p, groupId: grupo.id } })
    produtosCriados[p.sku] = prod.id
  }

  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@grupogourmet.com.br' } })
  if (!adminUser) throw new Error('Admin user not found')

  const hoje = new Date()
  const lotes = [
    { sku: 'CARNE-180G', qty: 15, cost: 38.90, expiry: new Date(hoje.getTime() + 3 * 86400000), lot: 'LT-CARNE-001' },
    { sku: 'PAO-BRIOCHE', qty: 120, cost: 1.50, expiry: new Date(hoje.getTime() + 7 * 86400000), lot: 'LT-PAO-001' },
    { sku: 'QUEIJO-CHED', qty: 5, cost: 45.00, expiry: new Date(hoje.getTime() + 30 * 86400000), lot: 'LT-QUEIJO-001' },
    { sku: 'ALFACE-CRE', qty: 4, cost: 8.00, expiry: new Date(hoje.getTime() + 3 * 86400000), lot: 'LT-ALFACE-001' },
    { sku: 'TOMATE-ITA', qty: 6, cost: 6.50, expiry: new Date(hoje.getTime() + 7 * 86400000), lot: 'LT-TOMATE-001' },
    { sku: 'BACON-FATI', qty: 3, cost: 52.00, expiry: new Date(hoje.getTime() + 7 * 86400000), lot: 'LT-BACON-001' },
    { sku: 'MOLHO-ESP', qty: 3, cost: 12.00, expiry: new Date(hoje.getTime() + 7 * 86400000), lot: 'LT-MOLHO-001' },
    { sku: 'REFRI-350', qty: 96, cost: 2.20, expiry: new Date(hoje.getTime() + 180 * 86400000), lot: 'LT-REFRI-001' },
    { sku: 'AGUA-500', qty: 48, cost: 1.00, expiry: new Date(hoje.getTime() + 365 * 86400000), lot: 'LT-AGUA-001' },
    { sku: 'EMBAL-BURG', qty: 300, cost: 0.25, expiry: null, lot: 'LT-EMBAL-001' },
  ]

  for (const lote of lotes) {
    const productId = produtosCriados[lote.sku]
    if (!productId) continue
    const novoLote = await prisma.inventoryLot.create({
      data: { productId, unitId: unidadeBurger1.id, supplierId: fornecedor.id, lotNumber: lote.lot, expiryDate: lote.expiry, quantity: lote.qty, remainingQuantity: lote.qty, unitCost: lote.cost },
    })
    await prisma.stockMovement.create({
      data: { productId, unitId: unidadeBurger1.id, lotId: novoLote.id, userId: adminUser.id, type: 'ENTRY', quantity: lote.qty, unitCost: lote.cost, totalCost: lote.qty * lote.cost, reason: 'Estoque inicial' },
    })
    await prisma.productCost.upsert({
      where: { productId_unitId: { productId, unitId: unidadeBurger1.id } },
      update: { averageCost: lote.cost, lastCost: lote.cost },
      create: { productId, unitId: unidadeBurger1.id, averageCost: lote.cost, lastCost: lote.cost },
    })
  }

  await prisma.technicalSheet.create({
    data: {
      name: 'Smash Burger Clássico', unitId: unidadeBurger1.id, yield: 1, yieldUnit: 'UN', preparationTime: 8, cost: 0,
      ingredients: {
        create: [
          { productId: produtosCriados['CARNE-180G'], quantity: 0.18, unitOfMeasure: UOM.KG, wasteFactor: 0.05, netQuantity: 0.171 },
          { productId: produtosCriados['PAO-BRIOCHE'], quantity: 1, unitOfMeasure: UOM.UN, wasteFactor: 0.02, netQuantity: 0.98 },
          { productId: produtosCriados['QUEIJO-CHED'], quantity: 0.03, unitOfMeasure: UOM.KG, wasteFactor: 0.01, netQuantity: 0.0297 },
          { productId: produtosCriados['ALFACE-CRE'], quantity: 0.02, unitOfMeasure: UOM.KG, wasteFactor: 0.10, netQuantity: 0.018 },
          { productId: produtosCriados['TOMATE-ITA'], quantity: 0.03, unitOfMeasure: UOM.KG, wasteFactor: 0.05, netQuantity: 0.0285 },
          { productId: produtosCriados['MOLHO-ESP'], quantity: 0.015, unitOfMeasure: UOM.L, wasteFactor: 0, netQuantity: 0.015 },
        ],
      },
    },
  })

  await prisma.alert.createMany({
    data: [
      { type: 'EXPIRING_PRODUCT', unitId: unidadeBurger1.id, productId: produtosCriados['CARNE-180G'], message: 'Carne Bovina Moída vence em 3 dias', severity: 'HIGH', read: false },
      { type: 'EXPIRING_PRODUCT', unitId: unidadeBurger1.id, productId: produtosCriados['ALFACE-CRE'], message: 'Alface Crespa vence em 3 dias', severity: 'MEDIUM', read: false },
      { type: 'LOW_STOCK', unitId: unidadeBurger1.id, productId: produtosCriados['BACON-FATI'], message: 'Bacon Fatiado próximo do estoque mínimo', severity: 'MEDIUM', read: false },
    ],
  })

  return {
    success: true,
    message: 'Setup concluído com sucesso!',
    credenciais: {
      admin: { email: 'admin@grupogourmet.com.br', senha: 'Admin@123', role: 'GROUP_ADMIN' },
      gerente: { email: 'gerente.burger@grupogourmet.com.br', senha: 'Gerente@123', role: 'BRAND_ADMIN' },
      estoquista: { email: 'estoquista.sb001@grupogourmet.com.br', senha: 'Estoque@123', role: 'STOCK_KEEPER' },
    },
  }
}

// GET — acessível direto pelo navegador com token na URL
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const setupSecret = process.env.SETUP_SECRET

  if (!setupSecret || token !== setupSecret) {
    return NextResponse.json({ error: 'Token inválido. Use ?token=SEU_SETUP_SECRET' }, { status: 401 })
  }

  try {
    const result = await runSetup()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Erro no setup', detail: String(error) }, { status: 500 })
  }
}

// POST — mantido para compatibilidade
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-setup-secret')
  const setupSecret = process.env.SETUP_SECRET

  if (!setupSecret || secret !== setupSecret) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const result = await runSetup()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Erro no setup', detail: String(error) }, { status: 500 })
  }
}
