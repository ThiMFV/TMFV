import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'

const createUnitSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('BR'),
  timezone: z.string().default('America/Sao_Paulo'),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId') || user.brandId || undefined

  try {
    const where = {
      ...(brandId ? { brandId } : {}),
      brand: { groupId: user.groupId ?? undefined },
    }

    const units = await prisma.unit.findMany({
      where,
      include: { brand: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: units })
  } catch (error) {
    console.error('GET /api/units error:', error)
    return NextResponse.json({ error: 'Erro ao buscar unidades' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createUnitSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Verify brand belongs to user's group
    const brand = await prisma.brand.findUnique({ where: { id: parsed.data.brandId } })
    if (!brand || brand.groupId !== user.groupId) {
      return NextResponse.json({ error: 'Marca não encontrada ou sem permissão' }, { status: 403 })
    }

    const unit = await prisma.unit.create({
      data: parsed.data,
      include: { brand: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ data: unit }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Código já cadastrado nesta marca' }, { status: 409 })
    }
    console.error('POST /api/units error:', error)
    return NextResponse.json({ error: 'Erro ao criar unidade' }, { status: 500 })
  }
}
