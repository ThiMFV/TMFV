import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/top-bar";
import { BrandHeader } from "@/components/brand-header";
import { SectorTabs } from "@/components/sector-tabs";
import { FilterPanel } from "@/components/filter-panel";
import { NewsFeed, FeedGroup } from "@/components/news-feed";
import { Pagination } from "@/components/pagination";
import { RightSidebar } from "@/components/right-sidebar";
import { NewsItemData } from "@/components/news-item";
import { hostnameFromUrl } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  period?: string;
  sort?: string;
  group?: string;
  page?: string;
  day?: string;
  from?: string;
  to?: string;
  theme?: string | string[];
  kw?: string | string[];
  source?: string | string[];
};

const PERIOD_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "6m": 180,
  "1y": 365,
};
const PAGE_SIZE = 30;

function dateRange(s: Search): { gte?: Date; lte?: Date } {
  if (s.day) {
    const d = new Date(s.day);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    return { gte: d, lte: next };
  }
  if (s.from || s.to) {
    const gte = s.from ? new Date(s.from) : undefined;
    let lte: Date | undefined;
    if (s.to) {
      lte = new Date(s.to);
      lte.setDate(lte.getDate() + 1);
    }
    return { gte, lte };
  }
  const days = PERIOD_DAYS[s.period ?? "7d"] ?? 7;
  const gte = new Date();
  gte.setDate(gte.getDate() - days);
  return { gte };
}

function asArray(v: string | string[] | undefined) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function orderByForSort(sort?: string): Prisma.NewsItemOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ publishedAt: "asc" }];
    case "relevance":
      return [{ relevance: { sort: "desc", nulls: "last" } }, { publishedAt: "desc" }];
    case "impact":
      return [
        { important: "desc" },
        { relevance: { sort: "desc", nulls: "last" } },
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
  const [sectors, sector] = await Promise.all([
    prisma.sector.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.sector.findUnique({
      where: { slug: params.sector },
      include: {
        themes: {
          where: { active: true },
          orderBy: { order: "asc" },
          include: {
            keywords: { where: { active: true }, orderBy: { term: "asc" } },
          },
        },
      },
    }),
  ]);
  if (!sector) notFound();

  const themeIds = sector.themes.map((t) => t.id);
  const themeIdsFilter = asArray(searchParams.theme);
  const keywordIdsFilter = asArray(searchParams.kw);
  const sourceIdsFilter = asArray(searchParams.source);

  // Map keyword ids to terms for filtering by matched terms
  const keywordTerms = sector.themes.flatMap((t) =>
    t.keywords
      .filter(
        (k) => keywordIdsFilter.length === 0 || keywordIdsFilter.includes(k.id),
      )
      .map((k) => k.term),
  );

  const range = dateRange(searchParams);
  const q = searchParams.q?.trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Prisma.NewsItemWhereInput = {
    archived: false,
    classifications: {
      some: {
        themeId: { in: themeIdsFilter.length ? themeIdsFilter : themeIds },
      },
    },
    publishedAt: {
      ...(range.gte ? { gte: range.gte } : {}),
      ...(range.lte ? { lte: range.lte } : {}),
    },
    ...(sourceIdsFilter.length
      ? { sourceId: { in: sourceIdsFilter } }
      : {}),
    ...(keywordIdsFilter.length
      ? { matchedTerms: { hasSome: keywordTerms } }
      : {}),
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

  const [total, items] = await Promise.all([
    prisma.newsItem.count({ where }),
    prisma.newsItem.findMany({
      where,
      orderBy: orderByForSort(searchParams.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        source: { select: { name: true } },
        classifications: {
          where: { themeId: { in: themeIds } },
          include: { theme: true },
        },
      },
    }),
  ]);

  const themeNameById = new Map(sector.themes.map((t) => [t.id, t.name]));

  // Build flat news cards
  const newsCards: NewsItemData[] = items.map((n) => {
    const themesForItem = Array.from(
      new Set(
        n.classifications
          .filter((c) => themeNameById.has(c.themeId))
          .map((c) => themeNameById.get(c.themeId)!),
      ),
    );
    return {
      id: n.id,
      title: n.title,
      url: n.url,
      publishedAt: n.publishedAt,
      fetchedAt: n.fetchedAt,
      sourceName: n.source.name,
      sourceHost: hostnameFromUrl(n.url),
      excerpt: n.excerpt,
      aiSummary: n.aiSummary,
      aiInsight: n.aiInsight,
      relevance: n.relevance,
      sentiment: n.sentiment as NewsItemData["sentiment"],
      category: n.category,
      matchedTerms: n.matchedTerms,
      themeNames: themesForItem,
      sectorName: sector.name,
      favorited: n.favorited,
      important: n.important,
    };
  });

  // Grouping
  const groupBy = searchParams.group ?? "theme";
  const groups: FeedGroup[] = buildGroups(groupBy, items, newsCards, sector);

  // Filter panel options
  const themesOptions = sector.themes.map((t) => ({
    value: t.id,
    label: t.name,
  }));
  const keywordsOptions = sector.themes.flatMap((t) =>
    t.keywords.map((k) => ({ value: k.id, label: `${k.term} (${t.name})` })),
  );
  const allSources = await prisma.source.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const sourcesOptions = allSources.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-muted/20">
      <Suspense fallback={<div className="h-12 bg-[#1f2937]" />}>
        <TopBar />
      </Suspense>
      <BrandHeader sector={{ name: sector.name, slug: sector.slug }} />
      <SectorTabs sectors={sectors} current={sector.slug} />

      <div className="mx-auto grid max-w-[1480px] gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="space-y-4">
          <Suspense fallback={<div className="h-32 rounded-md border bg-card" />}>
            <FilterPanel
              themes={themesOptions}
              keywords={keywordsOptions}
              sources={sourcesOptions}
            />
          </Suspense>
          <NewsFeed groups={groups} total={total} />
          <Suspense>
            <Pagination page={page} pageCount={pageCount} />
          </Suspense>
        </main>
        <Suspense>
          <RightSidebar sectorSlug={sector.slug} />
        </Suspense>
      </div>
    </div>
  );
}

type NewsRow = {
  id: string;
  matchedTerms: string[];
  classifications: { themeId: string; theme: { id: string; name: string; kind: string } }[];
};

function buildGroups(
  groupBy: string,
  items: NewsRow[],
  cards: NewsItemData[],
  sector: { themes: { id: string; name: string; kind: string; order: number }[] },
): FeedGroup[] {
  const byId = new Map(cards.map((c) => [c.id, c]));

  if (groupBy === "none") {
    return [
      {
        key: "all",
        label: "Todas as notícias",
        subgroups: [
          {
            key: "all",
            label: `${cards.length} notícias`,
            news: cards,
          },
        ],
      },
    ];
  }

  if (groupBy === "source") {
    const map = new Map<string, NewsItemData[]>();
    for (const c of cards) {
      const arr = map.get(c.sourceName) ?? [];
      arr.push(c);
      map.set(c.sourceName, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([source, arr]) => ({
        key: source,
        label: source,
        subgroups: [
          { key: source, label: `${arr.length} notícias`, news: arr },
        ],
      }));
  }

  if (groupBy === "keyword") {
    const map = new Map<string, NewsItemData[]>();
    for (const c of cards) {
      const k = c.matchedTerms[0] ?? "Sem palavra-chave";
      const arr = map.get(k) ?? [];
      arr.push(c);
      map.set(k, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([k, arr]) => ({
        key: k,
        label: k,
        subgroups: [{ key: k, label: `${arr.length} notícias`, news: arr }],
      }));
  }

  // Default: group by theme, sub-group by primary matched keyword
  const orderedThemes = [...sector.themes].sort((a, b) => a.order - b.order);
  const themesMap = new Map<
    string,
    { theme: { id: string; name: string }; subs: Map<string, NewsItemData[]> }
  >();
  for (const item of items) {
    const card = byId.get(item.id);
    if (!card) continue;
    // For each classification (theme), put the card under that theme's group
    const usedThemes = new Set<string>();
    for (const cls of item.classifications) {
      if (usedThemes.has(cls.themeId)) continue;
      usedThemes.add(cls.themeId);
      const subKey = item.matchedTerms[0] ?? "Outros";
      let entry = themesMap.get(cls.themeId);
      if (!entry) {
        entry = { theme: cls.theme, subs: new Map() };
        themesMap.set(cls.themeId, entry);
      }
      const arr = entry.subs.get(subKey) ?? [];
      arr.push(card);
      entry.subs.set(subKey, arr);
    }
  }
  return orderedThemes
    .map((t) => themesMap.get(t.id))
    .filter(
      (
        x,
      ): x is {
        theme: { id: string; name: string };
        subs: Map<string, NewsItemData[]>;
      } => Boolean(x),
    )
    .map((entry) => ({
      key: entry.theme.id,
      label: entry.theme.name,
      subgroups: Array.from(entry.subs.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([sub, arr]) => ({
          key: sub,
          label: sub,
          news: arr,
        })),
    }));
}
