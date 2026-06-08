import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'

const createSupplierSchema = z.object({
  name: z.string().min(1),
  cnpj: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined

  try {
    const suppliers = await prisma.supplier.findMany({
      where: {
        groupId,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ data: suppliers })
  } catch (error) {
    console.error('GET /api/suppliers error:', error)
    return NextResponse.json({ error: 'Erro ao buscar fornecedores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const groupId = user.groupId
  if (!groupId) return NextResponse.json({ error: 'groupId obrigatório' }, { status: 400 })

  try {
    const body = await request.json()
    const parsed = createSupplierSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: { ...parsed.data, groupId },
    })

    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error) {
    console.error('POST /api/suppliers error:', error)
    return NextResponse.json({ error: 'Erro ao criar fornecedor' }, { status: 500 })
  }
}
