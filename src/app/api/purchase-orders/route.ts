import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { POStatus } from '@prisma/client'

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
  totalCost: z.number().min(0),
})

const createPOSchema = z.object({
  purchaseRequestId: z.string().optional(),
  unitId: z.string().min(1),
  supplierId: z.string().min(1),
  totalAmount: z.number().min(0),
  expectedDelivery: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const status = searchParams.get('status') as POStatus | undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where = {
      ...(unitId ? { unitId } : {}),
      ...(status ? { status } : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          unit: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    return NextResponse.json({ data: { orders, total, page, limit } })
  } catch (error) {
    console.error('GET /api/purchase-orders error:', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos de compra' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createPOSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { items, expectedDelivery, ...orderData } = parsed.data

    const order = await prisma.purchaseOrder.create({
      data: {
        ...orderData,
        createdById: user.userId,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : undefined,
        items: {
          create: items,
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    console.error('POST /api/purchase-orders error:', error)
    return NextResponse.json({ error: 'Erro ao criar pedido de compra' }, { status: 500 })
  }
}
