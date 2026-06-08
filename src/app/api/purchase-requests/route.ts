import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { UOM, PRStatus } from '@prisma/client'

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitOfMeasure: z.nativeEnum(UOM),
  estimatedCost: z.number().min(0).optional(),
  supplierId: z.string().optional(),
})

const createPRSchema = z.object({
  unitId: z.string().min(1),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const status = searchParams.get('status') as PRStatus | undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where = {
      ...(unitId ? { unitId } : {}),
      ...(status ? { status } : {}),
    }

    const [requests, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        include: {
          unit: { select: { id: true, name: true } },
          requestedBy: { select: { id: true, name: true } },
          items: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.purchaseRequest.count({ where }),
    ])

    return NextResponse.json({ data: { requests, total, page, limit } })
  } catch (error) {
    console.error('GET /api/purchase-requests error:', error)
    return NextResponse.json({ error: 'Erro ao buscar solicitações de compra' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createPRSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { unitId, notes, items } = parsed.data

    const pr = await prisma.purchaseRequest.create({
      data: {
        unitId,
        requestedById: user.userId,
        notes,
        status: 'DRAFT',
        items: {
          create: items,
        },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json({ data: pr }, { status: 201 })
  } catch (error) {
    console.error('POST /api/purchase-requests error:', error)
    return NextResponse.json({ error: 'Erro ao criar solicitação de compra' }, { status: 500 })
  }
}
