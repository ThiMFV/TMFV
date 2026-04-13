import Parser from "rss-parser";
import type { NewsItem } from "@/types";

const rssParser = new Parser();

export async function fetchFromRSS(
  feedUrl: string,
  keywords: string[]
): Promise<NewsItem[]> {
  const feed = await rssParser.parseURL(feedUrl);

  return feed.items
    .filter((item) => {
      const text = `${item.title ?? ""} ${item.contentSnippet ?? ""}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw.toLowerCase()));
    })
    .map((item) => ({
      title: item.title ?? "Sem titulo",
      description: item.contentSnippet ?? null,
      url: item.link ?? "",
      source: feed.title ?? feedUrl,
      publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
    }));
}

export async function fetchFromNewsAPI(
  keywords: string[]
): Promise<NewsItem[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("NEWS_API_KEY nao configurada");

  const query = keywords.join(" OR ");
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=pt&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`NewsAPI erro: ${res.status}`);

  const data = await res.json();

  return (data.articles ?? []).map((article: Record<string, unknown>) => ({
    title: article.title as string,
    description: (article.description as string) ?? null,
    url: article.url as string,
    source: (article.source as { name: string })?.name ?? "NewsAPI",
    publishedAt: new Date(article.publishedAt as string),
  }));
}

export function deduplicateNews(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
