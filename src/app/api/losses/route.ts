import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { LossType, MovementType } from '@prisma/client'

const createLossSchema = z.object({
  productId: z.string().min(1),
  unitId: z.string().min(1),
  lotId: z.string().optional(),
  type: z.nativeEnum(LossType),
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
  reason: z.string().min(1),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const type = searchParams.get('type') as LossType | undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  try {
    const where = {
      ...(unitId ? { unitId } : {}),
      ...(type ? { type } : {}),
      ...(startDate || endDate
        ? {
            reportedAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    }

    const [losses, total] = await Promise.all([
      prisma.lossRecord.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          unit: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { reportedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lossRecord.count({ where }),
    ])

    // Summary by type
    const summary = await prisma.lossRecord.groupBy({
      by: ['type'],
      where,
      _sum: { totalCost: true, quantity: true },
    })

    return NextResponse.json({ data: { losses, total, page, limit, summary } })
  } catch (error) {
    console.error('GET /api/losses error:', error)
    return NextResponse.json({ error: 'Erro ao buscar perdas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createLossSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { quantity, unitCost, ...rest } = parsed.data
    const totalCost = quantity * unitCost

    const loss = await prisma.$transaction(async (tx) => {
      const record = await tx.lossRecord.create({
        data: {
          ...rest,
          quantity,
          unitCost,
          totalCost,
          userId: user.userId,
        },
        include: {
          product: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true } },
        },
      })

      // Create stock movement for the loss
      await tx.stockMovement.create({
        data: {
          productId: rest.productId,
          unitId: rest.unitId,
          lotId: rest.lotId,
          userId: user.userId,
          type: MovementType.LOSS,
          quantity,
          unitCost,
          totalCost,
          reason: rest.reason,
          notes: rest.notes,
          referenceId: record.id,
          referenceType: 'LossRecord',
        },
      })

      // Decrement lot if specified
      if (rest.lotId) {
        await tx.inventoryLot.update({
          where: { id: rest.lotId },
          data: { remainingQuantity: { decrement: quantity } },
        })
      }

      return record
    })

    return NextResponse.json({ data: loss }, { status: 201 })
  } catch (error) {
    console.error('POST /api/losses error:', error)
    return NextResponse.json({ error: 'Erro ao registrar perda' }, { status: 500 })
  }
}
