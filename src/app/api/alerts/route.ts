import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { AlertSeverity } from '@prisma/client'

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const unreadOnly = searchParams.get('unread') === 'true'
  const severity = searchParams.get('severity') as AlertSeverity | undefined
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    const where = {
      ...(unitId ? { unitId } : {}),
      ...(unreadOnly ? { read: false } : {}),
      ...(severity ? { severity } : {}),
    }

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: {
          unit: { select: { id: true, name: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alert.count({ where }),
    ])

    return NextResponse.json({ data: { alerts, total, page, limit } })
  } catch (error) {
    console.error('GET /api/alerts error:', error)
    return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const { ids, read = true } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids obrigatório' }, { status: 400 })
    }

    await prisma.alert.updateMany({
      where: { id: { in: ids } },
      data: { read },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('PATCH /api/alerts error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar alertas' }, { status: 500 })
  }
}
