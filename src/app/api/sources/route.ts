import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SourceType } from "@prisma/client";

export const runtime = "nodejs";

export async function GET() {
  const sources = await prisma.source.findMany({
    include: { sectors: { include: { sector: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(sources);
}

const createSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.nativeEnum(SourceType),
  language: z.string().default("pt"),
  international: z.boolean().default(false),
  sectorIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const data = createSchema.parse(await req.json());
  const source = await prisma.source.create({
    data: {
      name: data.name,
      url: data.url,
      type: data.type,
      language: data.language,
      international: data.international,
      sectors: {
        create: data.sectorIds.map((sectorId) => ({ sectorId })),
      },
    },
  });
  return NextResponse.json(source);
}
