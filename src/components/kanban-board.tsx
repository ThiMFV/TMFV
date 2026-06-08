import { NewsCard, NewsCardData } from "@/components/news-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type KanbanColumn = {
  themeId: string;
  themeSlug: string;
  name: string;
  kind: string;
  description?: string | null;
  count: number;
  news: NewsCardData[];
};

const COLUMN_ACCENT: Record<string, string> = {
  PORTFOLIO: "border-t-emerald-500",
  COMPETITOR: "border-t-rose-500",
  STANDARD: "border-t-sky-500",
  INTERNATIONAL: "border-t-violet-500",
  IMPORTANT: "border-t-amber-500",
};

export function KanbanBoard({ columns }: { columns: KanbanColumn[] }) {
  return (
    <div className="container py-4">
      <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-6 scrollbar-thin">
        {columns.map((col) => (
          <section
            key={col.themeId}
            className={cn(
              "flex min-h-[60vh] flex-col rounded-lg border border-t-4 bg-card/40",
              COLUMN_ACCENT[col.kind] ?? "border-t-primary",
            )}
          >
            <header className="sticky top-14 z-10 flex items-center justify-between gap-2 rounded-t-lg border-b bg-card/95 px-3 py-2 backdrop-blur">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">{col.name}</h3>
                  <Badge variant="muted" className="text-[10px]">
                    {col.count}
                  </Badge>
                </div>
                {col.description && (
                  <p className="truncate text-[11px] text-muted-foreground">
                    {col.description}
                  </p>
                )}
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 scrollbar-thin">
              {col.news.length === 0 && (
                <div className="grid flex-1 place-items-center rounded border border-dashed py-10 text-xs text-muted-foreground">
                  Sem notícias no período
                </div>
              )}
              {col.news.map((n) => (
                <NewsCard key={`${col.themeId}-${n.id}`} news={n} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
