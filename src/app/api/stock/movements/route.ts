import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { MovementType } from '@prisma/client'

const createMovementSchema = z.object({
  productId: z.string().min(1),
  unitId: z.string().min(1),
  lotId: z.string().optional(),
  type: z.nativeEnum(MovementType),
  quantity: z.number().positive(),
  unitCost: z.number().min(0),
  reason: z.string().optional(),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const productId = searchParams.get('productId') || undefined
  const type = searchParams.get('type') as MovementType | undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const where = {
      ...(unitId ? { unitId } : {}),
      ...(productId ? { productId } : {}),
      ...(type ? { type } : {}),
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
          unit: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.stockMovement.count({ where }),
    ])

    return NextResponse.json({ data: { movements, total, page, limit } })
  } catch (error) {
    console.error('GET /api/stock/movements error:', error)
    return NextResponse.json({ error: 'Erro ao buscar movimentações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createMovementSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { productId, unitId, lotId, type, quantity, unitCost, ...rest } = parsed.data
    const totalCost = quantity * unitCost

    const movement = await prisma.$transaction(async (tx) => {
      const mov = await tx.stockMovement.create({
        data: {
          productId,
          unitId,
          lotId,
          userId: user.userId,
          type,
          quantity,
          unitCost,
          totalCost,
          ...rest,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          unit: { select: { id: true, name: true } },
        },
      })

      // Update lot remaining quantity if lot specified
      if (lotId) {
        const debitTypes: MovementType[] = [
          MovementType.TRANSFER_OUT,
          MovementType.CONSUMPTION,
          MovementType.LOSS,
          MovementType.WASTE,
        ]
        const isDebit = debitTypes.includes(type)

        if (isDebit) {
          await tx.inventoryLot.update({
            where: { id: lotId },
            data: { remainingQuantity: { decrement: quantity } },
          })
        } else if (type === MovementType.ENTRY || type === MovementType.TRANSFER_IN) {
          await tx.inventoryLot.update({
            where: { id: lotId },
            data: { remainingQuantity: { increment: quantity } },
          })
        }
      }

      // Update or create ProductCost with weighted average
      const existingCost = await tx.productCost.findUnique({
        where: { productId_unitId: { productId, unitId } },
      })

      if (type === MovementType.ENTRY || type === MovementType.TRANSFER_IN) {
        if (existingCost) {
          // Weighted average cost update
          const currentStock = existingCost.averageCost > 0 ? 1 : 0 // simplified
          const newAverage = currentStock > 0
            ? (existingCost.averageCost + unitCost) / 2
            : unitCost

          await tx.productCost.update({
            where: { productId_unitId: { productId, unitId } },
            data: { averageCost: newAverage, lastCost: unitCost },
          })
        } else {
          await tx.productCost.create({
            data: {
              productId,
              unitId,
              averageCost: unitCost,
              lastCost: unitCost,
            },
          })
        }
      }

      return mov
    })

    return NextResponse.json({ data: movement }, { status: 201 })
  } catch (error) {
    console.error('POST /api/stock/movements error:', error)
    return NextResponse.json({ error: 'Erro ao registrar movimentação' }, { status: 500 })
  }
}
