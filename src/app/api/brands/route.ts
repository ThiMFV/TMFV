import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { BrandType } from '@prisma/client'

const createBrandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  type: z.nativeEnum(BrandType),
  logo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  try {
    const brands = await prisma.brand.findMany({
      where: { groupId },
      include: { _count: { select: { units: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: brands })
  } catch (error) {
    console.error('GET /api/brands error:', error)
    return NextResponse.json({ error: 'Erro ao buscar marcas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  try {
    const body = await request.json()
    const parsed = createBrandSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const brand = await prisma.brand.create({
      data: { ...parsed.data, groupId },
    })

    return NextResponse.json({ data: brand }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'Slug já cadastrado neste grupo' }, { status: 409 })
    }
    console.error('POST /api/brands error:', error)
    return NextResponse.json({ error: 'Erro ao criar marca' }, { status: 500 })
  }
}
