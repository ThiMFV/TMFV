"use client";

import * as React from "react";
import {
  ExternalLink,
  Star,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  cn,
  formatRelative,
  formatDateTime,
  hostnameFromUrl,
  truncate,
} from "@/lib/utils";
import { useRouter } from "next/navigation";

export type NewsCardData = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | Date;
  sourceName: string;
  matchedTerms: string[];
  aiSummary?: string | null;
  aiInsight?: string | null;
  relevance?: number | null;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  category?: string | null;
  favorited: boolean;
  important: boolean;
  importantAuto: boolean;
};

const sentimentIcon = {
  POSITIVE: <TrendingUp className="h-3 w-3" />,
  NEGATIVE: <TrendingDown className="h-3 w-3" />,
  NEUTRAL: <Minus className="h-3 w-3" />,
};

const sentimentVariant: Record<string, "success" | "danger" | "muted"> = {
  POSITIVE: "success",
  NEGATIVE: "danger",
  NEUTRAL: "muted",
};

export function NewsCard({ news }: { news: NewsCardData }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [optimistic, setOptimistic] = React.useState({
    favorited: news.favorited,
    important: news.important,
  });

  const toggle = async (action: "favorite" | "important") => {
    const next =
      action === "favorite"
        ? { ...optimistic, favorited: !optimistic.favorited }
        : { ...optimistic, important: !optimistic.important };
    setOptimistic(next);
    startTransition(async () => {
      await fetch(`/api/news/${news.id}/${action}`, { method: "POST" });
      router.refresh();
    });
  };

  return (
    <Card
      className={cn(
        "group flex flex-col gap-2 border-border/60 transition-shadow hover:shadow-md",
        optimistic.important && "ring-1 ring-amber-500/40",
      )}
    >
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium">{news.sourceName}</span>
          <span>·</span>
          <span title={formatDateTime(news.publishedAt)}>
            {formatRelative(news.publishedAt)}
          </span>
          {typeof news.relevance === "number" && (
            <span className="ml-auto inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
              <Sparkles className="h-3 w-3" /> {news.relevance}
            </span>
          )}
        </div>

        <a
          href={news.url}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm font-semibold leading-snug text-foreground hover:underline"
        >
          {news.title}
        </a>

        {news.aiSummary && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {truncate(news.aiSummary, 240)}
          </p>
        )}

        {news.aiInsight && (
          <div className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1.5 text-[11px] leading-snug text-foreground/90">
            <span className="font-semibold text-primary">Insight: </span>
            {news.aiInsight}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1">
          {news.category && (
            <Badge variant="info" className="text-[10px]">
              {labelForCategory(news.category)}
            </Badge>
          )}
          {news.sentiment && (
            <Badge
              variant={sentimentVariant[news.sentiment] ?? "muted"}
              className="text-[10px]"
            >
              {sentimentIcon[news.sentiment]}{" "}
              {labelForSentiment(news.sentiment)}
            </Badge>
          )}
          {news.matchedTerms.slice(0, 4).map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t}
            </Badge>
          ))}
          {news.matchedTerms.length > 4 && (
            <span className="text-[10px] text-muted-foreground">
              +{news.matchedTerms.length - 4}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-center justify-between border-t pt-2">
          <span className="text-[10px] text-muted-foreground">
            {hostnameFromUrl(news.url)}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Favoritar"
              onClick={() => toggle("favorite")}
              disabled={pending}
              className="h-7 w-7"
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5",
                  optimistic.favorited && "fill-amber-400 text-amber-500",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Marcar importante"
              onClick={() => toggle("important")}
              disabled={pending}
              className="h-7 w-7"
            >
              <AlertTriangle
                className={cn(
                  "h-3.5 w-3.5",
                  optimistic.important && "fill-amber-500/40 text-amber-600",
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir original"
              asChild
              className="h-7 w-7"
            >
              <a href={news.url} target="_blank" rel="noreferrer noopener">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function labelForCategory(c: string) {
  return (
    {
      MARKET: "Mercado",
      COMPETITION: "Concorrência",
      REGULATION: "Regulação",
      ESG: "ESG",
      INVESTMENTS: "Investimentos",
      OPERATIONS: "Operações",
      TECHNOLOGY: "Tecnologia",
    }[c] ?? c
  );
}

function labelForSentiment(s: string) {
  return (
    { POSITIVE: "Positivo", NEUTRAL: "Neutro", NEGATIVE: "Negativo" }[s] ?? s
  );
}
