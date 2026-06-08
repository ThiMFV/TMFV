import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const updateSchema = z.object({
  slug: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const data = updateSchema.parse(await req.json());
  const sector = await prisma.sector.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(sector);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  await prisma.sector.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
