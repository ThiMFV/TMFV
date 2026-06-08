import Parser from "rss-parser";

const parser = new Parser({
  timeout: 20_000,
  headers: { "User-Agent": "LorinvestIntelligence/1.0 (+https://lorinvest.com.br)" },
});

export type RawNews = {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  author?: string;
  imageUrl?: string;
  publishedAt: Date;
};

export async function fetchRss(url: string): Promise<RawNews[]> {
  const feed = await parser.parseURL(url);
  const items: RawNews[] = [];
  for (const item of feed.items ?? []) {
    const link = item.link?.trim();
    const title = item.title?.trim();
    if (!link || !title) continue;
    const content =
      (item as { content?: string }).content ||
      (item as { contentSnippet?: string }).contentSnippet ||
      item.summary ||
      "";
    const excerpt =
      (item as { contentSnippet?: string }).contentSnippet ||
      stripHtml(content).slice(0, 280);
    const publishedAt = item.isoDate
      ? new Date(item.isoDate)
      : item.pubDate
        ? new Date(item.pubDate)
        : new Date();
    items.push({
      url: link,
      title,
      content: stripHtml(content),
      excerpt,
      author: item.creator || (item as { author?: string }).author,
      imageUrl: extractImage(item),
      publishedAt,
    });
  }
  return items;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImage(item: Record<string, unknown>): string | undefined {
  const enclosure = item.enclosure as { url?: string } | undefined;
  if (enclosure?.url) return enclosure.url;
  const mediaContent = (item as { ["media:content"]?: { $?: { url?: string } } })[
    "media:content"
  ];
  if (mediaContent?.$?.url) return mediaContent.$.url;
  const content = String(item.content ?? "");
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}
