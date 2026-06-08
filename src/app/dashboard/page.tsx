import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { TopBar } from "@/components/top-bar";
import { BrandHeader } from "@/components/brand-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [
    sectors,
    countToday,
    countWeek,
    important,
    bySectorRaw,
    byCategoryRaw,
    bySentimentRaw,
    topSourcesRaw,
    topNews,
    currentTrendsRaw,
    pastTrendsRaw,
  ] = await Promise.all([
    prisma.sector.findMany({
      orderBy: { order: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.newsItem.count({ where: { publishedAt: { gte: since24h } } }),
    prisma.newsItem.count({ where: { publishedAt: { gte: since7d } } }),
    prisma.newsItem.count({
      where: { important: true, publishedAt: { gte: since7d } },
    }),
    prisma.newsClassification.groupBy({
      by: ["themeId"],
      _count: { _all: true },
      where: { createdAt: { gte: since7d } },
      orderBy: { _count: { themeId: "desc" } },
    }),
    prisma.newsItem.groupBy({
      by: ["category"],
      _count: { _all: true },
      where: { publishedAt: { gte: since7d }, category: { not: null } },
    }),
    prisma.newsItem.groupBy({
      by: ["sentiment"],
      _count: { _all: true },
      where: { publishedAt: { gte: since7d }, sentiment: { not: null } },
    }),
    prisma.newsItem.groupBy({
      by: ["sourceId"],
      _count: { _all: true },
      where: { publishedAt: { gte: since7d } },
      orderBy: { _count: { sourceId: "desc" } },
      take: 10,
    }),
    prisma.newsItem.findMany({
      where: { publishedAt: { gte: since24h } },
      orderBy: [{ relevance: "desc" }, { publishedAt: "desc" }],
      take: 10,
      include: { source: { select: { name: true } } },
    }),
    prisma.newsClassification.groupBy({
      by: ["themeId"],
      _count: { _all: true },
      where: { createdAt: { gte: since7d } },
    }),
    prisma.newsClassification.groupBy({
      by: ["themeId"],
      _count: { _all: true },
      where: { createdAt: { gte: since14d, lt: since7d } },
    }),
  ]);

  const themes = await prisma.theme.findMany({
    where: {
      id: { in: bySectorRaw.map((b) => b.themeId) },
    },
    include: { sector: true },
  });
  const themeById = new Map(themes.map((t) => [t.id, t]));

  const sectorCounts = new Map<string, number>();
  for (const b of bySectorRaw) {
    const t = themeById.get(b.themeId);
    if (!t) continue;
    sectorCounts.set(
      t.sector.name,
      (sectorCounts.get(t.sector.name) ?? 0) + b._count._all,
    );
  }

  const sourceIds = topSourcesRaw.map((x) => x.sourceId);
  const sources = await prisma.source.findMany({
    where: { id: { in: sourceIds } },
  });

  // Tendências: crescimento % por tema entre janela atual e anterior
  const trendsCurrent = new Map(
    currentTrendsRaw.map((c) => [c.themeId, c._count._all]),
  );
  const trendsPast = new Map(
    pastTrendsRaw.map((c) => [c.themeId, c._count._all]),
  );
  const trendsThemes = await prisma.theme.findMany({
    where: { id: { in: Array.from(trendsCurrent.keys()) } },
    include: { sector: { select: { name: true } } },
  });
  const trends = trendsThemes
    .map((t) => {
      const cur = trendsCurrent.get(t.id) ?? 0;
      const past = trendsPast.get(t.id) ?? 0;
      const growth = past === 0 ? (cur > 0 ? 100 : 0) : ((cur - past) / past) * 100;
      return {
        name: `${t.sector.name} · ${t.name}`,
        current: cur,
        past,
        growth,
      };
    })
    .filter((t) => t.current >= 3)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-muted/20">
      <Suspense fallback={<div className="h-12 bg-[#1f2937]" />}>
        <TopBar />
      </Suspense>
      <BrandHeader />
      <div className="mx-auto max-w-[1480px] space-y-6 px-6 py-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Executivo
          </h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada dos últimos 7 dias.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-4">
          <KpiCard label="Notícias hoje" value={countToday} />
          <KpiCard label="Notícias na semana" value={countWeek} />
          <KpiCard
            label="Marcadas importante"
            value={important}
            tone="amber"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <KpiCard
            label="Tendências em alta"
            value={trends.filter((t) => t.growth > 30).length}
            tone="emerald"
            icon={<TrendingUp className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Notícias por setor (7d)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sectors.map((s) => {
                const c = sectorCounts.get(s.name) ?? 0;
                const max = Math.max(
                  ...Array.from(sectorCounts.values()),
                  1,
                );
                return (
                  <Link
                    href={`/intelligence/${s.slug}`}
                    key={s.id}
                    className="block"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span>{s.name}</span>
                      <span className="font-medium">{c}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(c / max) * 100}%` }}
                      />
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Radar de tendências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {trends.length === 0 && (
                <div className="rounded border border-dashed py-6 text-center text-xs text-muted-foreground">
                  Sem dados suficientes (precisa de 14 dias de histórico).
                </div>
              )}
              {trends.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                >
                  <span className="truncate pr-2">{t.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {t.past} → {t.current}
                    </span>
                    <Badge
                      variant={
                        t.growth > 30
                          ? "success"
                          : t.growth > 0
                            ? "info"
                            : "muted"
                      }
                    >
                      {t.growth >= 0 ? "+" : ""}
                      {Math.round(t.growth)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição por categoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byCategoryRaw.map((c) => (
                <div
                  key={String(c.category)}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{c.category}</span>
                  <Badge variant="info">{c._count._all}</Badge>
                </div>
              ))}
              {byCategoryRaw.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ative o Claude para enriquecer as notícias.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sentimento agregado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bySentimentRaw.map((s) => (
                <div
                  key={String(s.sentiment)}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{s.sentiment}</span>
                  <Badge
                    variant={
                      s.sentiment === "POSITIVE"
                        ? "success"
                        : s.sentiment === "NEGATIVE"
                          ? "danger"
                          : "muted"
                    }
                  >
                    {s._count._all}
                  </Badge>
                </div>
              ))}
              {bySentimentRaw.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ative o Claude para classificação de sentimento.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Top 10 da semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {topNews.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start justify-between gap-3 border-b pb-2 text-sm last:border-0"
                  >
                    <div className="min-w-0">
                      <a
                        href={n.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium hover:underline"
                      >
                        {n.title}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {n.source.name} · {formatRelative(n.publishedAt)}
                      </div>
                    </div>
                    {typeof n.relevance === "number" && (
                      <Badge variant="info">
                        <Sparkles className="h-3 w-3" /> {n.relevance}
                      </Badge>
                    )}
                  </li>
                ))}
                {topNews.length === 0 && (
                  <li className="text-xs text-muted-foreground">
                    Sem notícias nas últimas 24 horas.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fontes mais relevantes</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="text-left">
                    <th className="pb-2">Fonte</th>
                    <th className="pb-2 text-right">Notícias na semana</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topSourcesRaw.map((s) => (
                    <tr key={s.sourceId}>
                      <td className="py-2">
                        {sources.find((x) => x.id === s.sourceId)?.name ?? "—"}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {s._count._all}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone?: "amber" | "emerald";
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div
            className={
              "mt-1 text-2xl font-semibold " +
              (tone === "amber"
                ? "text-amber-600 dark:text-amber-400"
                : tone === "emerald"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "")
            }
          >
            {value}
          </div>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
