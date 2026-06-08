import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { BrandType } from '@prisma/client'

const updateBrandSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  type: z.nativeEnum(BrandType).optional(),
  logo: z.string().optional(),
  active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
      include: { units: true },
    })
    if (!brand) return NextResponse.json({ error: 'Marca não encontrada' }, { status: 404 })
    if (brand.groupId !== user.groupId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    return NextResponse.json({ data: brand })
  } catch (error) {
    console.error('GET /api/brands/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao buscar marca' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const existing = await prisma.brand.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Marca não encontrada' }, { status: 404 })
    if (existing.groupId !== user.groupId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    const body = await request.json()
    const parsed = updateBrandSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const brand = await prisma.brand.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json({ data: brand })
  } catch (error) {
    console.error('PATCH /api/brands/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar marca' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const existing = await prisma.brand.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Marca não encontrada' }, { status: 404 })
    if (existing.groupId !== user.groupId) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    // Soft delete via deactivate
    const brand = await prisma.brand.update({ where: { id: params.id }, data: { active: false } })
    return NextResponse.json({ data: brand })
  } catch (error) {
    console.error('DELETE /api/brands/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao desativar marca' }, { status: 500 })
  }
}
