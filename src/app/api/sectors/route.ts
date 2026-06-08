import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const sectors = await prisma.sector.findMany({
    orderBy: { order: "asc" },
    include: {
      themes: { orderBy: { order: "asc" } },
      _count: { select: { themes: true } },
    },
  });
  return NextResponse.json(sectors);
}

const createSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export async function POST(req: Request) {
  const data = createSchema.parse(await req.json());
  const sector = await prisma.sector.create({ data });
  return NextResponse.json(sector);
}
