import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SourceType } from "@prisma/client";

export const runtime = "nodejs";

const updateSchema = z.object({
  name: z.string().optional(),
  url: z.string().url().optional(),
  type: z.nativeEnum(SourceType).optional(),
  language: z.string().optional(),
  international: z.boolean().optional(),
  active: z.boolean().optional(),
  sectorIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const data = updateSchema.parse(await req.json());
  const { sectorIds, ...rest } = data;
  const source = await prisma.$transaction(async (tx) => {
    const updated = await tx.source.update({
      where: { id: params.id },
      data: rest,
    });
    if (sectorIds) {
      await tx.sourceSector.deleteMany({ where: { sourceId: params.id } });
      await tx.sourceSector.createMany({
        data: sectorIds.map((sectorId) => ({
          sourceId: params.id,
          sectorId,
        })),
      });
    }
    return updated;
  });
  return NextResponse.json(source);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  await prisma.source.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
