"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 ano" },
];

const SORTS = [
  { value: "recent", label: "Mais recentes" },
  { value: "oldest", label: "Mais antigas" },
  { value: "relevance", label: "Maior relevância" },
  { value: "impact", label: "Maior impacto" },
];

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const currentPeriod = params.get("period") ?? "7d";
  const currentSort = params.get("sort") ?? "recent";

  const setParam = (key: string, value: string) => {
    const usp = new URLSearchParams(params.toString());
    usp.set(key, value);
    router.push(`${pathname}?${usp.toString()}`);
  };

  return (
    <div className="container flex flex-wrap items-center gap-3 py-3">
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Período
        </span>
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={currentPeriod === p.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setParam("period", p.value)}
            className={cn(
              "h-7 px-2.5 text-xs",
              currentPeriod === p.value && "border",
            )}
          >
            {p.label}
          </Button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Ordenar
        </span>
        {SORTS.map((s) => (
          <Button
            key={s.value}
            variant={currentSort === s.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setParam("sort", s.value)}
            className={cn(
              "h-7 px-2.5 text-xs",
              currentSort === s.value && "border",
            )}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
