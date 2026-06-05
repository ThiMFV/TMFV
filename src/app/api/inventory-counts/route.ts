import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { CountType } from '@prisma/client'

const itemSchema = z.object({
  productId: z.string().min(1),
  lotId: z.string().optional(),
  systemQuantity: z.number().min(0),
  countedQuantity: z.number().min(0),
  unitCost: z.number().min(0),
})

const createCountSchema = z.object({
  unitId: z.string().min(1),
  type: z.nativeEnum(CountType),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where = {
      ...(unitId ? { unitId } : {}),
    }

    const [counts, total] = await Promise.all([
      prisma.inventoryCount.findMany({
        where,
        include: {
          unit: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventoryCount.count({ where }),
    ])

    return NextResponse.json({ data: { counts, total, page, limit } })
  } catch (error) {
    console.error('GET /api/inventory-counts error:', error)
    return NextResponse.json({ error: 'Erro ao buscar contagens' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createCountSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { items, ...countData } = parsed.data

    const itemsWithDivergence = items.map((item) => ({
      ...item,
      divergence: item.countedQuantity - item.systemQuantity,
      divergenceValue: (item.countedQuantity - item.systemQuantity) * item.unitCost,
    }))

    const count = await prisma.inventoryCount.create({
      data: {
        ...countData,
        createdById: user.userId,
        status: 'DRAFT',
        items: {
          create: itemsWithDivergence,
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: count }, { status: 201 })
  } catch (error) {
    console.error('POST /api/inventory-counts error:', error)
    return NextResponse.json({ error: 'Erro ao criar contagem de estoque' }, { status: 500 })
  }
}
