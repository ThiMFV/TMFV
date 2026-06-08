import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'

const updateUnitSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  active: z.boolean().optional(),
})

async function getUnitAndVerify(id: string, groupId: string | null) {
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { brand: { select: { groupId: true } } },
  })
  if (!unit) return null
  if (unit.brand.groupId !== groupId) return null
  return unit
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const unit = await getUnitAndVerify(params.id, user.groupId)
    if (!unit) return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })
    return NextResponse.json({ data: unit })
  } catch (error) {
    console.error('GET /api/units/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao buscar unidade' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const existing = await getUnitAndVerify(params.id, user.groupId)
    if (!existing) return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })

    const body = await request.json()
    const parsed = updateUnitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const unit = await prisma.unit.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json({ data: unit })
  } catch (error) {
    console.error('PATCH /api/units/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar unidade' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const existing = await getUnitAndVerify(params.id, user.groupId)
    if (!existing) return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })

    const unit = await prisma.unit.update({ where: { id: params.id }, data: { active: false } })
    return NextResponse.json({ data: unit })
  } catch (error) {
    console.error('DELETE /api/units/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao desativar unidade' }, { status: 500 })
  }
}
