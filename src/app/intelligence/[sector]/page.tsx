import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/app-header";
import { SectorTabs } from "@/components/sector-tabs";
import { FilterBar } from "@/components/filter-bar";
import { KanbanBoard, KanbanColumn } from "@/components/kanban-board";
import { NewsCardData } from "@/components/news-card";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Search = {
  period?: string;
  sort?: string;
  q?: string;
};

const PERIOD_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "6m": 180,
  "1y": 365,
};

function periodSince(period?: string): Date {
  const days = PERIOD_DAYS[period ?? "7d"] ?? 7;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function orderByForSort(sort?: string): Prisma.NewsItemOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ publishedAt: "asc" }];
    case "relevance":
      return [{ relevance: "desc" }, { publishedAt: "desc" }];
    case "impact":
      return [
        { important: "desc" },
        { relevance: "desc" },
        { publishedAt: "desc" },
      ];
    default:
      return [{ publishedAt: "desc" }];
  }
}

export default async function SectorPage({
  params,
  searchParams,
}: {
  params: { sector: string };
  searchParams: Search;
}) {
  const sectors = await prisma.sector.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
    select: { slug: true, name: true },
  });

  const sector = await prisma.sector.findUnique({
    where: { slug: params.sector },
    include: {
      themes: { where: { active: true }, orderBy: { order: "asc" } },
    },
  });
  if (!sector) notFound();

  const since = periodSince(searchParams.period);
  const orderBy = orderByForSort(searchParams.sort);
  const q = searchParams.q?.trim();

  const columns: KanbanColumn[] = [];

  for (const theme of sector.themes) {
    const where: Prisma.NewsItemWhereInput = {
      classifications: { some: { themeId: theme.id } },
      publishedAt: { gte: since },
      archived: false,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { aiSummary: { contains: q, mode: "insensitive" } },
              { rawContent: { contains: q, mode: "insensitive" } },
              { searchText: { contains: q, mode: "insensitive" } },
              { source: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, count] = await Promise.all([
      prisma.newsItem.findMany({
        where,
        orderBy,
        take: 50,
        include: { source: { select: { name: true } } },
      }),
      prisma.newsItem.count({ where }),
    ]);

    columns.push({
      themeId: theme.id,
      themeSlug: theme.slug,
      name: theme.name,
      kind: theme.kind,
      description: theme.description,
      count,
      news: items.map(toCard),
    });
  }

  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="h-14 border-b" />}>
        <AppHeader currentSector={sector.slug} />
      </Suspense>
      <SectorTabs sectors={sectors} current={sector.slug} />
      <Suspense fallback={<div className="container py-3" />}>
        <FilterBar />
      </Suspense>
      <KanbanBoard columns={columns} />
    </div>
  );
}

function toCard(item: {
  id: string;
  title: string;
  url: string;
  publishedAt: Date;
  matchedTerms: string[];
  aiSummary: string | null;
  aiInsight: string | null;
  relevance: number | null;
  sentiment: string | null;
  category: string | null;
  favorited: boolean;
  important: boolean;
  importantAuto: boolean;
  source: { name: string };
}): NewsCardData {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    publishedAt: item.publishedAt,
    sourceName: item.source.name,
    matchedTerms: item.matchedTerms,
    aiSummary: item.aiSummary,
    aiInsight: item.aiInsight,
    relevance: item.relevance,
    sentiment: item.sentiment as NewsCardData["sentiment"],
    category: item.category,
    favorited: item.favorited,
    important: item.important,
    importantAuto: item.importantAuto,
  };
}
