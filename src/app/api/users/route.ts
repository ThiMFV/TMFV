import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { UserRole } from '@prisma/client'
import { hash } from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  brandId: z.string().optional(),
  unitId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  try {
    const users = await prisma.user.findMany({
      where: { groupId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        brandId: true,
        unitId: true,
        active: true,
        createdAt: true,
        brand: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('GET /api/users error:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  // Only admins can create users
  if (!['GROUP_ADMIN', 'BRAND_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { password, ...rest } = parsed.data
    const passwordHash = await hash(password, 12)

    const newUser = await prisma.user.create({
      data: { ...rest, passwordHash, groupId },
      select: {
        id: true, name: true, email: true, role: true,
        brandId: true, unitId: true, active: true, createdAt: true,
      },
    })

    return NextResponse.json({ data: newUser }, { status: 201 })
  } catch (error: unknown) {
    const e = error as { code?: string }
    if (e.code === 'P2002') {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }
    console.error('POST /api/users error:', error)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
