"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Sector = { slug: string; name: string };

export function SectorTabs({
  sectors,
  current,
}: {
  sectors: Sector[];
  current: string;
}) {
  const pathname = usePathname();
  const search = pathname.split("?")[1] ? `?${pathname.split("?")[1]}` : "";
  return (
    <nav className="border-b bg-card/50">
      <div className="container flex gap-1 overflow-x-auto scrollbar-thin">
        {sectors.map((s) => {
          const active = s.slug === current;
          return (
            <Link
              key={s.slug}
              href={`/intelligence/${s.slug}${search}`}
              className={cn(
                "relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors",
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
