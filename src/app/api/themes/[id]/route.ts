import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ThemeKind } from "@prisma/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  slug: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  kind: z.nativeEnum(ThemeKind).optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const data = updateSchema.parse(await req.json());
  const theme = await prisma.theme.update({ where: { id: params.id }, data });
  return NextResponse.json(theme);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  await prisma.theme.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
