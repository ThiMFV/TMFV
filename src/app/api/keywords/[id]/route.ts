import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const updateSchema = z.object({
  term: z.string().min(1).optional(),
  requireAll: z.array(z.string()).optional(),
  excludeAny: z.array(z.string()).optional(),
  titleOnly: z.boolean().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const data = updateSchema.parse(body);
  const kw = await prisma.keyword.update({ where: { id: params.id }, data });
  return NextResponse.json(kw);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  await prisma.keyword.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
