"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as React from "react";
import { Search, ChevronDown, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Notícias", href: "/intelligence" },
  { label: "Seleção", href: "/intelligence?view=selection" },
  { label: "Busca", href: "/intelligence?view=search" },
];

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = React.useState(params.get("q") ?? "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const usp = new URLSearchParams(params.toString());
    if (query.trim()) usp.set("q", query.trim());
    else usp.delete("q");
    router.push(`${pathname}?${usp.toString()}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1f2937] text-white">
      <div className="mx-auto flex h-12 max-w-[1480px] items-center gap-6 px-6">
        <Link href="/" className="flex items-baseline gap-1.5 font-semibold">
          <span className="text-xs uppercase tracking-[0.2em] text-white/60">
            Lorinvest
          </span>
          <span className="text-base lowercase tracking-tight">intelligence</span>
        </Link>

        <nav className="flex items-center gap-1">
          {TABS.map((t) => {
            const active =
              t.href === "/intelligence"
                ? pathname.startsWith("/intelligence")
                : false;
            return (
              <Link
                key={t.label}
                href={t.href}
                className={cn(
                  "rounded px-3 py-1 text-sm transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submit} className="ml-auto flex w-full max-w-md">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no título, subtítulo ou texto da notícia"
              className="h-8 border-white/15 bg-white/10 pl-8 text-sm text-white placeholder:text-white/40 focus-visible:ring-white/30"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="flex items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-white/10">
            <User className="h-4 w-4" />
            <span className="hidden md:inline">Admin</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </div>
      </div>
    </header>
  );
}
