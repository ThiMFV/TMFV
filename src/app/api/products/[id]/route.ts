import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { UOM } from '@prisma/client'

const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  internalCode: z.string().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  unitOfMeasure: z.nativeEnum(UOM).optional(),
  brandId: z.string().optional(),
  weight: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  minStock: z.number().min(0).optional(),
  idealStock: z.number().min(0).optional(),
  shelfLifeDays: z.number().int().positive().optional(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const product = await prisma.product.findFirst({
      where: { id: params.id, groupId: user.groupId ?? undefined },
      include: {
        category: true,
        costs: true,
      },
    })

    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id: params.id, groupId: user.groupId ?? undefined },
    })
    if (!existing) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    const product = await prisma.product.update({
      where: { id: params.id },
      data: parsed.data,
      include: { category: true },
    })

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('PATCH /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const existing = await prisma.product.findFirst({
      where: { id: params.id, groupId: user.groupId ?? undefined },
    })
    if (!existing) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    // Soft delete
    await prisma.product.update({
      where: { id: params.id },
      data: { active: false },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao desativar produto' }, { status: 500 })
  }
}
