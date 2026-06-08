import { prisma } from "@/lib/db";
import { fetchRss, RawNews } from "./rss";
import { classify, ThemeWithKeywords } from "./classify";
import { fingerprintOf } from "./fingerprint";
import { enrichNews, aiEnabled } from "@/lib/ai/claude";
import { Source, SourceType } from "@prisma/client";

type SectorWithThemes = {
  id: string;
  name: string;
  themes: ThemeWithKeywords[];
};

async function loadSectors(): Promise<SectorWithThemes[]> {
  return prisma.sector.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      themes: {
        where: { active: true },
        include: { keywords: { where: { active: true } } },
      },
    },
    orderBy: { order: "asc" },
  });
}

async function loadSourcesForRun(sourceId?: string): Promise<
  (Source & { sectors: { sectorId: string }[] })[]
> {
  return prisma.source.findMany({
    where: {
      active: true,
      ...(sourceId ? { id: sourceId } : {}),
    },
    include: { sectors: { select: { sectorId: true } } },
  });
}

export type RunResult = {
  sourcesProcessed: number;
  itemsFound: number;
  itemsNew: number;
  errors: number;
};

export async function runIngestion(opts?: {
  sourceId?: string;
  triggeredBy?: "cron" | "manual" | "api";
  withAi?: boolean;
}): Promise<RunResult> {
  const triggeredBy = opts?.triggeredBy ?? "manual";
  const withAi = opts?.withAi ?? aiEnabled;

  const sectors = await loadSectors();
  const sources = await loadSourcesForRun(opts?.sourceId);

  const allThemes = sectors.flatMap((s) => s.themes);

  const result: RunResult = {
    sourcesProcessed: 0,
    itemsFound: 0,
    itemsNew: 0,
    errors: 0,
  };

  for (const source of sources) {
    const run = await prisma.ingestionRun.create({
      data: { sourceId: source.id, status: "RUNNING", triggeredBy },
    });

    try {
      let items: RawNews[] = [];
      switch (source.type) {
        case SourceType.RSS:
        case SourceType.GOOGLE_NEWS_RSS:
        case SourceType.NEWSAPI:
        case SourceType.GNEWS:
          items = await fetchRss(source.url);
          break;
        case SourceType.SCRAPER:
        case SourceType.MANUAL:
        default:
          items = [];
      }

      result.sourcesProcessed += 1;
      result.itemsFound += items.length;

      let newCount = 0;
      for (const raw of items) {
        const fp = fingerprintOf(raw.url, raw.title);
        const exists = await prisma.newsItem.findUnique({
          where: { fingerprint: fp },
          select: { id: true },
        });
        if (exists) continue;

        // Restringe os temas considerados: somente os setores associados a fonte
        // (ou todos, se a fonte nao tiver setor associado).
        const allowedSectorIds = source.sectors.length
          ? new Set(source.sectors.map((s) => s.sectorId))
          : null;
        const themes = allowedSectorIds
          ? allThemes.filter((t) => allowedSectorIds.has(t.sectorId))
          : allThemes;

        const cls = classify(
          {
            title: raw.title,
            body: raw.content || raw.excerpt || "",
            isInternationalSource: source.international,
          },
          themes,
        );

        if (cls.matches.length === 0) continue;

        let aiData = null;
        if (withAi) {
          aiData = await enrichNews({
            title: raw.title,
            excerpt: raw.excerpt,
            rawContent: raw.content,
            source: source.name,
            matchedTerms: cls.matchedTermsAll,
          });
        }

        const created = await prisma.newsItem.create({
          data: {
            url: raw.url,
            fingerprint: fp,
            title: raw.title,
            rawContent: raw.content,
            excerpt: raw.excerpt,
            author: raw.author,
            imageUrl: raw.imageUrl,
            publishedAt: raw.publishedAt,
            language: source.language,
            sourceId: source.id,
            matchedTerms: cls.matchedTermsAll,
            importantAuto: cls.importantAuto,
            important: cls.importantAuto,
            aiSummary: aiData?.summary,
            aiInsight: aiData?.insight,
            category: aiData?.category,
            sentiment: aiData?.sentiment,
            relevance: aiData?.relevance,
            searchText: [
              raw.title,
              raw.excerpt,
              raw.content,
              cls.matchedTermsAll.join(" "),
              source.name,
            ]
              .filter(Boolean)
              .join(" \n "),
            classifications: {
              create: cls.matches.map((m) => ({
                themeId: m.themeId,
                matchedTerms: m.matchedTerms,
                score: m.score,
              })),
            },
          },
        });
        if (created) newCount += 1;
      }

      result.itemsNew += newCount;

      await prisma.$transaction([
        prisma.ingestionRun.update({
          where: { id: run.id },
          data: {
            status: "SUCCESS",
            finishedAt: new Date(),
            itemsFound: items.length,
            itemsNew: newCount,
          },
        }),
        prisma.source.update({
          where: { id: source.id },
          data: {
            status: "ONLINE",
            lastSuccessAt: new Date(),
            errorStreak: 0,
            fetchCount: { increment: 1 },
          },
        }),
      ]);
    } catch (err) {
      result.errors += 1;
      const message = (err as Error).message?.slice(0, 500) ?? "unknown";
      await prisma.$transaction([
        prisma.ingestionRun.update({
          where: { id: run.id },
          data: {
            status: "ERROR",
            finishedAt: new Date(),
            error: message,
          },
        }),
        prisma.source.update({
          where: { id: source.id },
          data: {
            status: "OFFLINE",
            lastErrorAt: new Date(),
            lastError: message,
            errorStreak: { increment: 1 },
          },
        }),
      ]);
    }
  }

  return result;
}
