import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { MovementType } from '@prisma/client'

const saleItemSchema = z.object({
  externalProductId: z.string(),
  sku: z.string().optional(),
  name: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
})

const webhookSchema = z.object({
  externalId: z.string().min(1),
  unitCode: z.string().min(1),
  saleDate: z.string(),
  totalAmount: z.number().min(0),
  items: z.array(saleItemSchema),
})

export async function POST(request: NextRequest) {
  // Validate webhook secret
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret !== process.env.PDV_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = webhookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { externalId, unitCode, saleDate, totalAmount, items } = parsed.data

    // Find unit by code
    const unit = await prisma.unit.findFirst({
      where: { code: unitCode, active: true },
    })

    if (!unit) {
      return NextResponse.json({ error: `Unit not found: ${unitCode}` }, { status: 404 })
    }

    // Check for duplicate
    const existing = await prisma.saleEvent.findUnique({
      where: { unitId_externalId: { unitId: unit.id, externalId } },
    })

    if (existing) {
      return NextResponse.json({ data: { message: 'Already processed', id: existing.id } })
    }

    // Create sale event
    const saleEvent = await prisma.$transaction(async (tx) => {
      const event = await tx.saleEvent.create({
        data: {
          unitId: unit.id,
          externalId,
          saleDate: new Date(saleDate),
          totalAmount,
          items: items as object[],
        },
      })

      // For each item, find matching technical sheet and decrement stock
      for (const item of items) {
        const product = item.sku
          ? await tx.product.findFirst({ where: { sku: item.sku } })
          : null

        if (!product) continue

        // Find technical sheets that produce this product (by name match - simplified)
        const technicalSheets = await tx.technicalSheet.findMany({
          where: { unitId: unit.id, active: true, name: item.name },
          include: { ingredients: true },
        })

        for (const sheet of technicalSheets) {
          const portionsConsumed = item.quantity
          for (const ingredient of sheet.ingredients) {
            const consumedQty = ingredient.netQuantity * portionsConsumed

            // Find lot with FIFO
            const lots = await tx.inventoryLot.findMany({
              where: {
                productId: ingredient.productId,
                unitId: unit.id,
                status: 'ACTIVE',
                remainingQuantity: { gt: 0 },
              },
              orderBy: { createdAt: 'asc' },
            })

            let remaining = consumedQty
            for (const lot of lots) {
              if (remaining <= 0) break
              const deduct = Math.min(remaining, lot.remainingQuantity)

              await tx.inventoryLot.update({
                where: { id: lot.id },
                data: { remainingQuantity: { decrement: deduct } },
              })

              await tx.stockMovement.create({
                data: {
                  productId: ingredient.productId,
                  unitId: unit.id,
                  lotId: lot.id,
                  userId: 'system',
                  type: MovementType.CONSUMPTION,
                  quantity: deduct,
                  unitCost: lot.unitCost,
                  totalCost: deduct * lot.unitCost,
                  reason: `Venda PDV - ${externalId}`,
                  referenceId: event.id,
                  referenceType: 'SaleEvent',
                },
              })

              remaining -= deduct
            }
          }
        }
      }

      // Mark as processed
      await tx.saleEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date() },
      })

      return event
    })

    return NextResponse.json({ data: { id: saleEvent.id, processed: true } }, { status: 201 })
  } catch (error) {
    console.error('POST /api/pdv/webhook error:', error)
    return NextResponse.json({ error: 'Erro ao processar venda' }, { status: 500 })
  }
}
