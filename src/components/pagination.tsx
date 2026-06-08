"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (p: number) => {
    const usp = new URLSearchParams(params.toString());
    if (p <= 1) usp.delete("page");
    else usp.set("page", String(p));
    router.push(`${pathname}?${usp.toString()}`);
  };

  if (pageCount <= 1) return null;

  // Generate page numbers around current
  const pages: (number | "…")[] = [];
  const push = (n: number | "…") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) push(i);
    else push("…");
  }

  return (
    <nav className="flex items-center justify-center gap-1 py-3">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="rounded border px-2 py-1 text-xs disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={i} className="px-1.5 text-xs text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => go(p)}
            className={cn(
              "min-w-[28px] rounded border px-2 py-1 text-xs",
              p === page
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        className="rounded border px-2 py-1 text-xs disabled:opacity-40"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
      <span className="ml-2 text-xs text-muted-foreground">
        Página {page} de {pageCount}
      </span>
    </nav>
  );
}
