import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db/prisma'
import { getUserFromRequest } from '@/lib/auth/context'
import { UOM } from '@prisma/client'

const ingredientSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitOfMeasure: z.nativeEnum(UOM),
  wasteFactor: z.number().min(0).max(1).default(0),
  netQuantity: z.number().positive(),
})

const createTSSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  unitId: z.string().min(1),
  yield: z.number().positive(),
  yieldUnit: z.nativeEnum(UOM),
  preparationTime: z.number().int().positive().optional(),
  ingredients: z.array(ingredientSchema).min(1),
})

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const unitId = searchParams.get('unitId') || user.unitId || undefined
  const search = searchParams.get('search') || undefined

  try {
    const sheets = await prisma.technicalSheet.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
        active: true,
      },
      include: {
        unit: { select: { id: true, name: true } },
        ingredients: {
          include: {
            product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: sheets })
  } catch (error) {
    console.error('GET /api/technical-sheets error:', error)
    return NextResponse.json({ error: 'Erro ao buscar fichas técnicas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = createTSSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { ingredients, ...sheetData } = parsed.data

    // Calculate cost from ingredients
    let cost = 0
    for (const ing of ingredients) {
      const productCost = await prisma.productCost.findFirst({
        where: { productId: ing.productId, unitId: sheetData.unitId },
      })
      if (productCost) {
        cost += ing.netQuantity * productCost.averageCost
      }
    }

    const sheet = await prisma.technicalSheet.create({
      data: {
        ...sheetData,
        cost,
        ingredients: {
          create: ingredients,
        },
      },
      include: {
        ingredients: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({ data: sheet }, { status: 201 })
  } catch (error) {
    console.error('POST /api/technical-sheets error:', error)
    return NextResponse.json({ error: 'Erro ao criar ficha técnica' }, { status: 500 })
  }
}
