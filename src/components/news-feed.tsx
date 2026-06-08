import { NewsItem, NewsItemData } from "@/components/news-item";

export type FeedGroup = {
  key: string;
  label: string;
  subgroups: FeedSubGroup[];
};
export type FeedSubGroup = {
  key: string;
  label: string;
  news: NewsItemData[];
};

export function NewsFeed({
  groups,
  total,
}: {
  groups: FeedGroup[];
  total: number;
}) {
  return (
    <section className="overflow-hidden rounded-md border bg-card">
      <header className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span>
          Notícias: <span className="font-semibold text-foreground">{total}</span>{" "}
          resultados
        </span>
      </header>
      {groups.length === 0 && (
        <div className="grid place-items-center px-4 py-16 text-sm text-muted-foreground">
          Nenhuma notícia encontrada com os filtros atuais.
        </div>
      )}
      {groups.map((g) => (
        <div key={g.key}>
          <h2 className="bg-muted px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/80">
            {g.label}
          </h2>
          {g.subgroups.map((sub) => (
            <div key={`${g.key}-${sub.key}`}>
              <h3 className="border-y bg-muted/30 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {sub.label}
              </h3>
              {sub.news.map((n) => (
                <NewsItem key={`${sub.key}-${n.id}`} news={n} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
