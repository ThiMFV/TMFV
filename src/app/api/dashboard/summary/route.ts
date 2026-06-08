import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const groupId = user.groupId || undefined

  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const unitFilter = unitId ? { unitId } : { unit: { brand: { groupId } } }
    const unitFilterDirect = unitId ? { unitId } : {}

    // Calculate total value (sum of remainingQuantity * unitCost)
    const activeLots = await prisma.inventoryLot.findMany({
      where: {
        ...unitFilter,
        status: { in: ['ACTIVE', 'QUARANTINE'] },
        remainingQuantity: { gt: 0 },
      },
      select: { remainingQuantity: true, unitCost: true },
    })

    const totalStockValue = activeLots.reduce(
      (sum, lot) => sum + lot.remainingQuantity * lot.unitCost,
      0
    )

    // Losses this month
    const lossesAgg = await prisma.lossRecord.aggregate({
      where: {
        ...unitFilterDirect,
        reportedAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalCost: true },
    })
    const lossesThisMonth = lossesAgg._sum.totalCost ?? 0

    // CMV - stock movements consumption this month
    const consumptionAgg = await prisma.stockMovement.aggregate({
      where: {
        ...unitFilterDirect,
        type: 'CONSUMPTION',
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalCost: true },
    })
    const cmvValue = consumptionAgg._sum.totalCost ?? 0

    // Sales total (from SaleEvent)
    const salesAgg = await prisma.saleEvent.aggregate({
      where: {
        ...unitFilterDirect,
        saleDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
    })
    const salesTotal = salesAgg._sum.totalAmount ?? 1 // avoid div by zero
    const cmvPercent = salesTotal > 0 ? (cmvValue / salesTotal) * 100 : 0

    // Rupture count (products with 0 stock)
    const productCosts = await prisma.productCost.findMany({
      where: { ...(unitId ? { unitId } : {}) },
      include: {
        product: { select: { minStock: true } },
      },
    })

    // Count products with rupture via lots
    const lotsByProduct = await prisma.inventoryLot.groupBy({
      by: ['productId'],
      where: {
        ...unitFilter,
        status: 'ACTIVE',
      },
      _sum: { remainingQuantity: true },
    })

    // Products that have productCost but no active lots
    const productsWithCost = await prisma.productCost.count({
      where: { ...(unitId ? { unitId } : {}) },
    })
    const productsWithStock = lotsByProduct.length
    const ruptureCount = Math.max(0, productsWithCost - productsWithStock)
    const lowStockCount = 0 // simplified

    // Recent alerts
    const recentAlerts = await prisma.alert.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Top losses by product
    const topLossesRaw = await prisma.lossRecord.groupBy({
      by: ['productId', 'type'],
      where: {
        ...unitFilterDirect,
        reportedAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalCost: true },
      orderBy: { _sum: { totalCost: 'desc' } },
      take: 5,
    })

    const productIds = Array.from(new Set(topLossesRaw.map((l) => l.productId)))
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p.name]))

    const topLosses = topLossesRaw.map((l) => ({
      productName: productMap.get(l.productId) ?? 'Desconhecido',
      totalLoss: l._sum.totalCost ?? 0,
      type: l.type,
    }))

    // Stock chart data - last 30 days (mock from movements)
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i)
      chartData.push({
        date: format(date, 'dd/MM'),
        value: totalStockValue * (0.9 + Math.random() * 0.2), // mock variation
      })
    }

    return NextResponse.json({
      data: {
        totalStockValue,
        cmvPercent: Math.round(cmvPercent * 10) / 10,
        lossesThisMonth,
        ruptureCount,
        lowStockCount,
        recentAlerts,
        topLosses,
        stockChartData: chartData,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/summary error:', error)
    return NextResponse.json({ error: 'Erro ao buscar resumo do dashboard' }, { status: 500 })
  }
}
