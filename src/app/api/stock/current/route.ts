import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { StockLevel } from '@/types'

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const brandId = searchParams.get('brandId') || user.brandId || undefined
  const groupId = user.groupId || undefined

  try {
    // Get all active lots to compute current stock
    const lots = await prisma.inventoryLot.findMany({
      where: {
        ...(unitId ? { unitId } : brandId ? { unit: { brandId } } : { unit: { brand: { groupId } } }),
        status: { in: ['ACTIVE', 'QUARANTINE'] },
        remainingQuantity: { gt: 0 },
      },
      include: {
        product: {
          include: { category: true },
        },
        unit: { select: { id: true, name: true } },
      },
    })

    // Aggregate by product + unit
    const stockMap = new Map<string, StockLevel>()

    for (const lot of lots) {
      const key = `${lot.productId}-${lot.unitId}`
      const existing = stockMap.get(key)

      if (existing) {
        existing.currentStock += lot.remainingQuantity
        existing.totalValue += lot.remainingQuantity * lot.unitCost
      } else {
        const product = lot.product
        const currentStock = lot.remainingQuantity
        const totalValue = currentStock * lot.unitCost

        let status: StockLevel['status'] = 'OK'
        if (currentStock <= 0) status = 'RUPTURE'
        else if (currentStock < product.minStock * 0.5) status = 'CRITICAL'
        else if (currentStock < product.minStock) status = 'LOW'

        stockMap.set(key, {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitId: lot.unitId,
          unitName: lot.unit.name,
          currentStock,
          unitOfMeasure: product.unitOfMeasure,
          minStock: product.minStock,
          idealStock: product.idealStock,
          averageCost: lot.unitCost,
          totalValue,
          status,
        })
      }
    }

    // Also include products with zero stock that have cost records
    const productCosts = await prisma.productCost.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
      },
      include: {
        product: true,
        unit: { select: { id: true, name: true } },
      },
    })

    for (const pc of productCosts) {
      const key = `${pc.productId}-${pc.unitId}`
      if (!stockMap.has(key)) {
        stockMap.set(key, {
          productId: pc.product.id,
          productName: pc.product.name,
          sku: pc.product.sku,
          unitId: pc.unitId,
          unitName: pc.unit.name,
          currentStock: 0,
          unitOfMeasure: pc.product.unitOfMeasure,
          minStock: pc.product.minStock,
          idealStock: pc.product.idealStock,
          averageCost: pc.averageCost,
          totalValue: 0,
          status: 'RUPTURE',
        })
      }
    }

    // Recalculate status after aggregation
    const stockLevels = Array.from(stockMap.values()).map((s) => {
      let status: StockLevel['status'] = 'OK'
      if (s.currentStock <= 0) status = 'RUPTURE'
      else if (s.currentStock < s.minStock * 0.5) status = 'CRITICAL'
      else if (s.currentStock < s.minStock) status = 'LOW'
      return { ...s, status }
    })

    stockLevels.sort((a, b) => a.productName.localeCompare(b.productName))

    return NextResponse.json({ data: stockLevels })
  } catch (error) {
    console.error('GET /api/stock/current error:', error)
    return NextResponse.json({ error: 'Erro ao buscar estoque atual' }, { status: 500 })
  }
}
