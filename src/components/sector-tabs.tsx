"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Sector = { slug: string; name: string };

export function SectorTabs({
  sectors,
  current,
}: {
  sectors: Sector[];
  current: string;
}) {
  return (
    <nav className="border-b bg-card">
      <div className="mx-auto flex max-w-[1480px] gap-1 overflow-x-auto px-6 scrollbar-thin">
        {sectors.map((s) => {
          const active = s.slug === current;
          return (
            <Link
              key={s.slug}
              href={`/intelligence/${s.slug}`}
              className={cn(
                "relative whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.name}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
