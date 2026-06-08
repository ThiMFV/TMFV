import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  _: Request,
  { params }: { params: { id: string } },
) {
  const current = await prisma.newsItem.findUnique({
    where: { id: params.id },
    select: { important: true },
  }).catch(() => null);

  if (!current) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const next = !current.important;
  await prisma.$transaction(async (tx) => {
    await tx.newsItem.update({
      where: { id: params.id },
      data: { important: next, importantAuto: next ? undefined : false },
    });
    // Sincroniza com a coluna IMPORTANTE: anexa/remove a classificacao
    // no tema importante de cada setor associado a fonte da noticia.
    const newsWithSource = await tx.newsItem.findUnique({
      where: { id: params.id },
      select: {
        source: { select: { sectors: { select: { sectorId: true } } } },
      },
    });
    const sectorIds = newsWithSource?.source.sectors.map((s) => s.sectorId) ?? [];
    const importantThemes = await tx.theme.findMany({
      where: {
        kind: "IMPORTANT",
        ...(sectorIds.length ? { sectorId: { in: sectorIds } } : {}),
      },
      select: { id: true },
    });
    if (next) {
      for (const t of importantThemes) {
        await tx.newsClassification.upsert({
          where: {
            newsItemId_themeId: { newsItemId: params.id, themeId: t.id },
          },
          update: { score: 50 },
          create: {
            newsItemId: params.id,
            themeId: t.id,
            matchedTerms: [],
            score: 50,
          },
        });
      }
    } else {
      for (const t of importantThemes) {
        await tx.newsClassification
          .delete({
            where: {
              newsItemId_themeId: { newsItemId: params.id, themeId: t.id },
            },
          })
          .catch(() => null);
      }
    }
  });

  return NextResponse.json({ id: params.id, important: next });
}
