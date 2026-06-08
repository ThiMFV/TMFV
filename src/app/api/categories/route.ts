import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'

const createCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().optional(),
  brandId: z.string().optional(),
  unitId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  try {
    const categories = await prisma.category.findMany({
      where: { groupId },
      include: {
        _count: { select: { products: true } },
        children: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  try {
    const body = await request.json()
    const parsed = createCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { ...parsed.data, groupId },
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('POST /api/categories error:', error)
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
  }
}
