import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ThemeKind } from "@prisma/client";

export const runtime = "nodejs";

const createSchema = z.object({
  sectorId: z.string(),
  slug: z.string().min(1),
  name: z.string().min(1),
  kind: z.nativeEnum(ThemeKind).default("STANDARD"),
  description: z.string().optional(),
  order: z.number().int().optional(),
});

export async function POST(req: Request) {
  const data = createSchema.parse(await req.json());
  const theme = await prisma.theme.create({ data });
  return NextResponse.json(theme);
}
