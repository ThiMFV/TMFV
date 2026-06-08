import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const themeId = url.searchParams.get("themeId") ?? undefined;
  const sectorSlug = url.searchParams.get("sector") ?? undefined;
  const keywords = await prisma.keyword.findMany({
    where: {
      ...(themeId ? { themeId } : {}),
      ...(sectorSlug ? { theme: { sector: { slug: sectorSlug } } } : {}),
    },
    include: { theme: { include: { sector: true } } },
    orderBy: [{ theme: { sector: { order: "asc" } } }, { term: "asc" }],
  });
  return NextResponse.json(keywords);
}

const createSchema = z.object({
  themeId: z.string(),
  term: z.string().min(1),
  requireAll: z.array(z.string()).optional(),
  excludeAny: z.array(z.string()).optional(),
  titleOnly: z.boolean().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const data = createSchema.parse(body);
  const keyword = await prisma.keyword.upsert({
    where: { themeId_term: { themeId: data.themeId, term: data.term } },
    update: {
      requireAll: data.requireAll ?? [],
      excludeAny: data.excludeAny ?? [],
      titleOnly: data.titleOnly ?? false,
      active: true,
    },
    create: {
      themeId: data.themeId,
      term: data.term,
      requireAll: data.requireAll ?? [],
      excludeAny: data.excludeAny ?? [],
      titleOnly: data.titleOnly ?? false,
    },
  });
  return NextResponse.json(keyword);
}
