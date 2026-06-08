import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const sectorSlug = url.searchParams.get("sector")?.trim();
  if (!q) return NextResponse.json([]);

  const sector = sectorSlug
    ? await prisma.sector.findUnique({
        where: { slug: sectorSlug },
        select: { id: true },
      })
    : null;

  const results = await prisma.newsItem.findMany({
    where: {
      AND: [
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { aiSummary: { contains: q, mode: "insensitive" } },
            { rawContent: { contains: q, mode: "insensitive" } },
            { searchText: { contains: q, mode: "insensitive" } },
            { source: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        sector
          ? {
              classifications: {
                some: { theme: { sectorId: sector.id } },
              },
            }
          : {},
      ],
    },
    take: 100,
    orderBy: { publishedAt: "desc" },
    include: { source: { select: { name: true } } },
  });

  return NextResponse.json(results);
}
