"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Star,
  AlertTriangle,
  Share2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn, formatDateTime, hostnameFromUrl } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export type NewsItemData = {
  id: string;
  title: string;
  url: string;
  publishedAt: string | Date;
  fetchedAt?: string | Date | null;
  sourceName: string;
  sourceHost?: string;
  excerpt?: string | null;
  aiSummary?: string | null;
  aiInsight?: string | null;
  relevance?: number | null;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  category?: string | null;
  matchedTerms: string[];
  themeNames: string[];
  sectorName?: string | null;
  favorited: boolean;
  important: boolean;
};

const ratingColors = {
  POSITIVE: "bg-emerald-500/90 text-white",
  NEUTRAL: "bg-amber-500/90 text-white",
  NEGATIVE: "bg-rose-500/90 text-white",
};

export function NewsItem({ news }: { news: NewsItemData }) {
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const [expand, setExpand] = React.useState(false);
  const [optimistic, setOptimistic] = React.useState({
    favorited: news.favorited,
    important: news.important,
  });

  const date = new Date(news.publishedAt);
  const dayLabel = format(date, "dd LLL", { locale: ptBR }).toUpperCase();
  const timeLabel = format(date, "HH:mm");

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

  const fullText = news.aiSummary || news.excerpt || "";
  const showMore = fullText.length > 280;

  return (
    <article
      className={cn(
        "border-b bg-card transition-colors hover:bg-muted/30",
        optimistic.important && "bg-amber-50/40 dark:bg-amber-950/10",
      )}
    >
      <div className="flex gap-4 px-4 py-3">
        {/* Date / time block */}
        <div className="w-16 shrink-0 border-r pr-3 text-right">
          <div className="text-xs font-bold tracking-wide text-foreground">
            {dayLabel}
          </div>
          <div className="text-xs text-muted-foreground">{timeLabel}</div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Header row: title left, actions right */}
          <div className="flex items-start justify-between gap-3">
            <a
              href={news.url}
              target="_blank"
              rel="noreferrer noopener"
              className="block text-[15px] font-semibold leading-snug text-brand-700 hover:underline dark:text-brand-300"
            >
              {news.title}
              <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" />
            </a>
            <div className="shrink-0 text-xs">
              <span className="text-muted-foreground">Ações: </span>
              <a
                href={news.url}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                Ler notícia
              </a>
            </div>
          </div>

          {/* Source / capture metadata */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{news.sourceName}</span>
            {news.sourceHost && (
              <>
                {" "}
                <span className="opacity-60">| {news.sourceHost}</span>
              </>
            )}
            <span>
              {" "}
              · Capturado em: {formatDateTime(news.publishedAt)}
              {news.fetchedAt && (
                <>
                  {" "}
                  | Cadastrado em: {formatDateTime(news.fetchedAt)}
                </>
              )}
            </span>
          </div>

          {/* Body / excerpt */}
          {fullText && (
            <p className="text-sm leading-relaxed text-foreground/90">
              {expand ? fullText : truncate(fullText, 280)}
              {showMore && (
                <button
                  type="button"
                  onClick={() => setExpand((v) => !v)}
                  className="ml-1 inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                >
                  {expand ? "Menos" : "Mais"}
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform",
                      expand && "rotate-180",
                    )}
                  />
                </button>
              )}
            </p>
          )}

          {news.aiInsight && (
            <div className="rounded border-l-2 border-primary/60 bg-primary/5 px-2 py-1 text-xs leading-snug">
              <span className="font-semibold text-primary">Insight: </span>
              {news.aiInsight}
            </div>
          )}

          {/* Classification footer */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            {news.sectorName && (
              <span className="font-medium text-foreground/80">
                {news.sectorName}
              </span>
            )}
            {news.themeNames.map((t) => (
              <span
                key={t}
                className="rounded bg-muted px-1.5 py-0.5 text-foreground/70"
              >
                {t}
              </span>
            ))}
            {news.matchedTerms.slice(0, 5).map((term) => (
              <span
                key={term}
                className="rounded bg-brand-100 px-1.5 py-0.5 text-brand-800 dark:bg-brand-950 dark:text-brand-300"
              >
                {term}
              </span>
            ))}
            {news.matchedTerms.length > 5 && (
              <span className="opacity-60">+{news.matchedTerms.length - 5}</span>
            )}
            {news.category && (
              <span className="ml-auto rounded bg-sky-100 px-1.5 py-0.5 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                {categoryLabel(news.category)}
              </span>
            )}
            {typeof news.relevance === "number" && (
              <span className="inline-flex items-center gap-0.5 rounded bg-primary/10 px-1.5 py-0.5 font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> {news.relevance}
              </span>
            )}
          </div>

          {/* Action row */}
          <div className="mt-1 flex items-center justify-between border-t pt-1.5">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5"
                  aria-label="Selecionar"
                />
                <span className="hidden md:inline">Selecionar</span>
              </label>
              <button
                type="button"
                onClick={() => toggle("important")}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors",
                  optimistic.important
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "hover:bg-muted",
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {optimistic.important ? "Importante" : "Marcar importante"}
              </button>
              <button
                type="button"
                onClick={() => toggle("favorite")}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors",
                  optimistic.favorited
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "hover:bg-muted",
                )}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5",
                    optimistic.favorited && "fill-amber-500",
                  )}
                />
                {optimistic.favorited ? "Favoritada" : "Favoritar"}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-muted"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.share) {
                    void navigator.share({ url: news.url, title: news.title });
                  } else if (typeof navigator !== "undefined") {
                    void navigator.clipboard.writeText(news.url);
                  }
                }}
              >
                <Share2 className="h-3.5 w-3.5" /> Compartilhar
              </button>
            </div>

            {/* Knewin-style rating buttons (sentimento) */}
            <div className="flex items-center gap-1">
              <span className="mr-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                Sentimento
              </span>
              {(["POSITIVE", "NEUTRAL", "NEGATIVE"] as const).map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-5 w-7 rounded transition-opacity",
                    news.sentiment === s
                      ? ratingColors[s]
                      : "bg-muted opacity-40",
                  )}
                  title={sentimentLabel(s)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function truncate(text: string, n: number) {
  return text.length > n ? text.slice(0, n).trimEnd() + "…" : text;
}

function categoryLabel(c: string) {
  return (
    ({
      MARKET: "Mercado",
      COMPETITION: "Concorrência",
      REGULATION: "Regulação",
      ESG: "ESG",
      INVESTMENTS: "Investimentos",
      OPERATIONS: "Operações",
      TECHNOLOGY: "Tecnologia",
    } as Record<string, string>)[c] ?? c
  );
}

function sentimentLabel(s: string) {
  return (
    ({
      POSITIVE: "Positivo",
      NEUTRAL: "Neutro",
      NEGATIVE: "Negativo",
    } as Record<string, string>)[s] ?? s
  );
}
