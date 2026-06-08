import { PrismaClient, UserRole, BrandType, UOM } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── Grupo ────────────────────────────────────────────────────────────────
  const grupo = await prisma.group.upsert({
    where: { slug: 'grupo-gourmet' },
    update: {},
    create: {
      name: 'Grupo Gourmet',
      slug: 'grupo-gourmet',
    },
  })
  console.log('✅ Grupo criado:', grupo.name)

  // ─── Marcas ───────────────────────────────────────────────────────────────
  const marcaBurger = await prisma.brand.upsert({
    where: { groupId_slug: { groupId: grupo.id, slug: 'smash-burger' } },
    update: {},
    create: {
      groupId: grupo.id,
      name: 'Smash Burger',
      slug: 'smash-burger',
      type: BrandType.BURGER,
    },
  })

  const marcaPizza = await prisma.brand.upsert({
    where: { groupId_slug: { groupId: grupo.id, slug: 'la-pizza' } },
    update: {},
    create: {
      groupId: grupo.id,
      name: 'La Pizza',
      slug: 'la-pizza',
      type: BrandType.PIZZA,
    },
  })

  const marcaCafe = await prisma.brand.upsert({
    where: { groupId_slug: { groupId: grupo.id, slug: 'cafe-verde' } },
    update: {},
    create: {
      groupId: grupo.id,
      name: 'Café Verde',
      slug: 'cafe-verde',
      type: BrandType.CAFE,
    },
  })
  console.log('✅ Marcas criadas')

  // ─── Unidades ─────────────────────────────────────────────────────────────
  const unidadeBurger1 = await prisma.unit.upsert({
    where: { brandId_code: { brandId: marcaBurger.id, code: 'SB-001' } },
    update: {},
    create: {
      brandId: marcaBurger.id,
      name: 'Smash Burger - Vila Madalena',
      code: 'SB-001',
      address: 'Rua Harmonia, 123',
      city: 'São Paulo',
      state: 'SP',
    },
  })

  const unidadeBurger2 = await prisma.unit.upsert({
    where: { brandId_code: { brandId: marcaBurger.id, code: 'SB-002' } },
    update: {},
    create: {
      brandId: marcaBurger.id,
      name: 'Smash Burger - Pinheiros',
      code: 'SB-002',
      address: 'Rua dos Pinheiros, 456',
      city: 'São Paulo',
      state: 'SP',
    },
  })

  const unidadePizza1 = await prisma.unit.upsert({
    where: { brandId_code: { brandId: marcaPizza.id, code: 'LP-001' } },
    update: {},
    create: {
      brandId: marcaPizza.id,
      name: 'La Pizza - Moema',
      code: 'LP-001',
      address: 'Av. Ibirapuera, 789',
      city: 'São Paulo',
      state: 'SP',
    },
  })

  const unidadeCafe1 = await prisma.unit.upsert({
    where: { brandId_code: { brandId: marcaCafe.id, code: 'CV-001' } },
    update: {},
    create: {
      brandId: marcaCafe.id,
      name: 'Café Verde - Jardins',
      code: 'CV-001',
      address: 'Rua Oscar Freire, 321',
      city: 'São Paulo',
      state: 'SP',
    },
  })
  console.log('✅ Unidades criadas')

  // ─── Usuários ─────────────────────────────────────────────────────────────
  const senhaHash = await bcrypt.hash('Admin@123', 10)
  const senhaGerenteHash = await bcrypt.hash('Gerente@123', 10)
  const senhaEstoquistaHash = await bcrypt.hash('Estoque@123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@grupogourmet.com.br' },
    update: {},
    create: {
      email: 'admin@grupogourmet.com.br',
      passwordHash: senhaHash,
      name: 'Administrador Grupo',
      role: UserRole.GROUP_ADMIN,
      groupId: grupo.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'gerente.burger@grupogourmet.com.br' },
    update: {},
    create: {
      email: 'gerente.burger@grupogourmet.com.br',
      passwordHash: senhaGerenteHash,
      name: 'Gerente - Smash Burger',
      role: UserRole.BRAND_ADMIN,
      groupId: grupo.id,
      brandId: marcaBurger.id,
    },
  })

  await prisma.user.upsert({
    where: { email: 'estoquista.sb001@grupogourmet.com.br' },
    update: {},
    create: {
      email: 'estoquista.sb001@grupogourmet.com.br',
      passwordHash: senhaEstoquistaHash,
      name: 'Estoquista - Vila Madalena',
      role: UserRole.STOCK_KEEPER,
      groupId: grupo.id,
      brandId: marcaBurger.id,
      unitId: unidadeBurger1.id,
    },
  })
  console.log('✅ Usuários criados')
  console.log('   admin@grupogourmet.com.br / Admin@123 (GROUP_ADMIN)')
  console.log('   gerente.burger@grupogourmet.com.br / Gerente@123 (BRAND_ADMIN)')
  console.log('   estoquista.sb001@grupogourmet.com.br / Estoque@123 (STOCK_KEEPER)')

  // ─── Fornecedores ─────────────────────────────────────────────────────────
  const fornecedorCarnes = await prisma.supplier.upsert({
    where: { id: 'supplier-carnes-001' },
    update: {},
    create: {
      id: 'supplier-carnes-001',
      name: 'Frigorífico São Paulo',
      cnpj: '12.345.678/0001-90',
      email: 'vendas@frigorifico-sp.com.br',
      phone: '(11) 3456-7890',
      groupId: grupo.id,
    },
  })

  const fornecedorBebidas = await prisma.supplier.upsert({
    where: { id: 'supplier-bebidas-001' },
    update: {},
    create: {
      id: 'supplier-bebidas-001',
      name: 'Distribuidora Bebidas Brasil',
      cnpj: '98.765.432/0001-10',
      email: 'pedidos@bebidas-brasil.com.br',
      phone: '(11) 9876-5432',
      groupId: grupo.id,
    },
  })
  console.log('✅ Fornecedores criados')

  // ─── Categorias ───────────────────────────────────────────────────────────
  const catCarnes = await prisma.category.create({
    data: { name: 'Carnes', groupId: grupo.id },
  }).catch(() => prisma.category.findFirst({ where: { name: 'Carnes', groupId: grupo.id } })) as { id: string }

  const catPaes = await prisma.category.create({
    data: { name: 'Pães e Massas', groupId: grupo.id },
  }).catch(() => prisma.category.findFirst({ where: { name: 'Pães e Massas', groupId: grupo.id } })) as { id: string }

  const catLaticinios = await prisma.category.create({
    data: { name: 'Laticínios', groupId: grupo.id },
  }).catch(() => prisma.category.findFirst({ where: { name: 'Laticínios', groupId: grupo.id } })) as { id: string }

  const catHortifruti = await prisma.category.create({
    data: { name: 'Hortifruti', groupId: grupo.id },
  }).catch(() => prisma.category.findFirst({ where: { name: 'Hortifruti', groupId: grupo.id } })) as { id: string }

  const catBebidas = await prisma.category.create({
    data: { name: 'Bebidas', groupId: grupo.id },
  }).catch(() => prisma.category.findFirst({ where: { name: 'Bebidas', groupId: grupo.id } })) as { id: string }

  const catDescartaveis = await prisma.category.create({
    data: { name: 'Descartáveis', groupId: grupo.id },
  }).catch(() => prisma.category.findFirst({ where: { name: 'Descartáveis', groupId: grupo.id } })) as { id: string }

  console.log('✅ Categorias criadas')

  // ─── Produtos ─────────────────────────────────────────────────────────────
  const produtos = [
    {
      sku: 'CARNE-180G',
      internalCode: 'MP-001',
      name: 'Carne Bovina Moída 180g',
      categoryId: catCarnes.id,
      unitOfMeasure: UOM.KG,
      groupId: grupo.id,
      minStock: 10,
      idealStock: 50,
      shelfLifeDays: 3,
    },
    {
      sku: 'PAO-BRIOCHE',
      internalCode: 'MP-002',
      name: 'Pão Brioche para Hambúrguer',
      categoryId: catPaes.id,
      unitOfMeasure: UOM.UN,
      groupId: grupo.id,
      minStock: 50,
      idealStock: 200,
      shelfLifeDays: 5,
    },
    {
      sku: 'QUEIJO-CHED',
      internalCode: 'MP-003',
      name: 'Queijo Cheddar Fatiado',
      categoryId: catLaticinios.id,
      unitOfMeasure: UOM.KG,
      groupId: grupo.id,
      minStock: 2,
      idealStock: 10,
      shelfLifeDays: 14,
    },
    {
      sku: 'ALFACE-CRE',
      internalCode: 'MP-004',
      name: 'Alface Crespa',
      categoryId: catHortifruti.id,
      unitOfMeasure: UOM.KG,
      groupId: grupo.id,
      minStock: 2,
      idealStock: 8,
      shelfLifeDays: 3,
    },
    {
      sku: 'TOMATE-ITA',
      internalCode: 'MP-005',
      name: 'Tomate Italiano',
      categoryId: catHortifruti.id,
      unitOfMeasure: UOM.KG,
      groupId: grupo.id,
      minStock: 2,
      idealStock: 10,
      shelfLifeDays: 5,
    },
    {
      sku: 'BACON-FATI',
      internalCode: 'MP-006',
      name: 'Bacon Fatiado',
      categoryId: catCarnes.id,
      unitOfMeasure: UOM.KG,
      groupId: grupo.id,
      minStock: 2,
      idealStock: 8,
      shelfLifeDays: 7,
    },
    {
      sku: 'MOLHO-ESP',
      internalCode: 'MP-007',
      name: 'Molho Especial da Casa',
      categoryId: catLaticinios.id,
      unitOfMeasure: UOM.L,
      groupId: grupo.id,
      minStock: 1,
      idealStock: 5,
      shelfLifeDays: 7,
    },
    {
      sku: 'REFRI-350',
      internalCode: 'BV-001',
      name: 'Refrigerante Lata 350ml',
      categoryId: catBebidas.id,
      unitOfMeasure: UOM.UN,
      groupId: grupo.id,
      minStock: 24,
      idealStock: 120,
      shelfLifeDays: 180,
    },
    {
      sku: 'AGUA-500',
      internalCode: 'BV-002',
      name: 'Água Mineral 500ml',
      categoryId: catBebidas.id,
      unitOfMeasure: UOM.UN,
      groupId: grupo.id,
      minStock: 12,
      idealStock: 60,
      shelfLifeDays: 365,
    },
    {
      sku: 'EMBAL-BURG',
      internalCode: 'DC-001',
      name: 'Embalagem Hambúrguer',
      categoryId: catDescartaveis.id,
      unitOfMeasure: UOM.UN,
      groupId: grupo.id,
      minStock: 100,
      idealStock: 500,
    },
  ]

  for (const prod of produtos) {
    await prisma.product.upsert({
      where: { groupId_sku: { groupId: prod.groupId, sku: prod.sku } },
      update: {},
      create: prod,
    })
  }
  console.log('✅ Produtos criados:', produtos.length)

  // ─── Ficha Técnica: Smash Burger Clássico ─────────────────────────────────
  const prodCarne = await prisma.product.findFirst({ where: { sku: 'CARNE-180G', groupId: grupo.id } })
  const prodPao = await prisma.product.findFirst({ where: { sku: 'PAO-BRIOCHE', groupId: grupo.id } })
  const prodQueijo = await prisma.product.findFirst({ where: { sku: 'QUEIJO-CHED', groupId: grupo.id } })
  const prodAlface = await prisma.product.findFirst({ where: { sku: 'ALFACE-CRE', groupId: grupo.id } })
  const prodTomate = await prisma.product.findFirst({ where: { sku: 'TOMATE-ITA', groupId: grupo.id } })
  const prodMolho = await prisma.product.findFirst({ where: { sku: 'MOLHO-ESP', groupId: grupo.id } })

  if (prodCarne && prodPao && prodQueijo && prodAlface && prodTomate && prodMolho) {
    const fichaExistente = await prisma.technicalSheet.findFirst({
      where: { name: 'Smash Burger Clássico', unitId: unidadeBurger1.id },
    })

    if (!fichaExistente) {
      await prisma.technicalSheet.create({
        data: {
          name: 'Smash Burger Clássico',
          description: 'Hambúrguer artesanal com blend premium 180g smashado na chapa',
          unitId: unidadeBurger1.id,
          yield: 1,
          yieldUnit: 'UN',
          preparationTime: 8,
          cost: 0, // será recalculado quando houver custos de produtos
          ingredients: {
            create: [
              { productId: prodCarne.id, quantity: 0.18, unitOfMeasure: UOM.KG, wasteFactor: 0.05, netQuantity: 0.171 },
              { productId: prodPao.id, quantity: 1, unitOfMeasure: UOM.UN, wasteFactor: 0.02, netQuantity: 0.98 },
              { productId: prodQueijo.id, quantity: 0.03, unitOfMeasure: UOM.KG, wasteFactor: 0.01, netQuantity: 0.0297 },
              { productId: prodAlface.id, quantity: 0.02, unitOfMeasure: UOM.KG, wasteFactor: 0.10, netQuantity: 0.018 },
              { productId: prodTomate.id, quantity: 0.03, unitOfMeasure: UOM.KG, wasteFactor: 0.05, netQuantity: 0.0285 },
              { productId: prodMolho.id, quantity: 0.015, unitOfMeasure: UOM.L, wasteFactor: 0, netQuantity: 0.015 },
            ],
          },
        },
      })
      console.log('✅ Ficha técnica criada: Smash Burger Clássico')
    }
  }

  // ─── Lotes de estoque iniciais ────────────────────────────────────────────
  const hoje = new Date()
  const em3dias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000)
  const em7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
  const em180dias = new Date(hoje.getTime() + 180 * 24 * 60 * 60 * 1000)

  const lotes = [
    { sku: 'CARNE-180G', qty: 15, cost: 38.90, expiry: em3dias, lot: 'LT-CARNE-001' },
    { sku: 'PAO-BRIOCHE', qty: 120, cost: 1.50, expiry: em7dias, lot: 'LT-PAO-001' },
    { sku: 'QUEIJO-CHED', qty: 5, cost: 45.00, expiry: em30dias, lot: 'LT-QUEIJO-001' },
    { sku: 'ALFACE-CRE', qty: 4, cost: 8.00, expiry: em3dias, lot: 'LT-ALFACE-001' },
    { sku: 'TOMATE-ITA', qty: 6, cost: 6.50, expiry: em7dias, lot: 'LT-TOMATE-001' },
    { sku: 'BACON-FATI', qty: 3, cost: 52.00, expiry: em7dias, lot: 'LT-BACON-001' },
    { sku: 'MOLHO-ESP', qty: 3, cost: 12.00, expiry: em7dias, lot: 'LT-MOLHO-001' },
    { sku: 'REFRI-350', qty: 96, cost: 2.20, expiry: em180dias, lot: 'LT-REFRI-001' },
    { sku: 'AGUA-500', qty: 48, cost: 1.00, expiry: em180dias, lot: 'LT-AGUA-001' },
    { sku: 'EMBAL-BURG', qty: 300, cost: 0.25, expiry: undefined, lot: 'LT-EMBAL-001' },
  ]

  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@grupogourmet.com.br' } })
  if (!adminUser) throw new Error('Admin user not found')

  for (const lote of lotes) {
    const prod = await prisma.product.findFirst({ where: { sku: lote.sku, groupId: grupo.id } })
    if (!prod) continue

    const loteExistente = await prisma.inventoryLot.findFirst({
      where: { lotNumber: lote.lot, unitId: unidadeBurger1.id },
    })
    if (loteExistente) continue

    const novoLote = await prisma.inventoryLot.create({
      data: {
        productId: prod.id,
        unitId: unidadeBurger1.id,
        supplierId: fornecedorCarnes.id,
        lotNumber: lote.lot,
        expiryDate: lote.expiry ?? null,
        quantity: lote.qty,
        remainingQuantity: lote.qty,
        unitCost: lote.cost,
      },
    })

    // Movimentação de entrada
    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        unitId: unidadeBurger1.id,
        lotId: novoLote.id,
        userId: adminUser.id,
        type: 'ENTRY',
        quantity: lote.qty,
        unitCost: lote.cost,
        totalCost: lote.qty * lote.cost,
        reason: 'Estoque inicial (seed)',
      },
    })

    // Custo médio do produto na unidade
    await prisma.productCost.upsert({
      where: { productId_unitId: { productId: prod.id, unitId: unidadeBurger1.id } },
      update: { averageCost: lote.cost, lastCost: lote.cost },
      create: { productId: prod.id, unitId: unidadeBurger1.id, averageCost: lote.cost, lastCost: lote.cost },
    })
  }
  console.log('✅ Lotes de estoque criados para Smash Burger - Vila Madalena')

  // ─── Alertas iniciais ─────────────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      {
        type: 'EXPIRING_PRODUCT',
        unitId: unidadeBurger1.id,
        productId: (await prisma.product.findFirst({ where: { sku: 'CARNE-180G', groupId: grupo.id } }))?.id,
        message: 'Carne Bovina Moída vence em 3 dias (Lote LT-CARNE-001)',
        severity: 'HIGH',
        read: false,
      },
      {
        type: 'EXPIRING_PRODUCT',
        unitId: unidadeBurger1.id,
        productId: (await prisma.product.findFirst({ where: { sku: 'ALFACE-CRE', groupId: grupo.id } }))?.id,
        message: 'Alface Crespa vence em 3 dias (Lote LT-ALFACE-001)',
        severity: 'MEDIUM',
        read: false,
      },
      {
        type: 'LOW_STOCK',
        unitId: unidadeBurger1.id,
        productId: (await prisma.product.findFirst({ where: { sku: 'BACON-FATI', groupId: grupo.id } }))?.id,
        message: 'Bacon Fatiado abaixo do estoque mínimo (3kg / mínimo 2kg)',
        severity: 'MEDIUM',
        read: false,
      },
    ],
    skipDuplicates: true,
  })
  console.log('✅ Alertas criados')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('\n📋 Credenciais de acesso:')
  console.log('   👑 GROUP_ADMIN:  admin@grupogourmet.com.br / Admin@123')
  console.log('   👔 BRAND_ADMIN:  gerente.burger@grupogourmet.com.br / Gerente@123')
  console.log('   📦 STOCK_KEEPER: estoquista.sb001@grupogourmet.com.br / Estoque@123')
  console.log('\n🌐 Acesse: http://localhost:3000/login')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
