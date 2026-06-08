"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import * as React from "react";
import { Search, RefreshCw, Settings2, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppHeader({ currentSector }: { currentSector?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [refreshing, setRefreshing] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const usp = new URLSearchParams(params.toString());
    if (query.trim()) usp.set("q", query.trim());
    else usp.delete("q");
    router.push(`${pathname}?${usp.toString()}`);
  };

  const triggerRefresh = async () => {
    try {
      setRefreshing(true);
      await fetch("/api/ingest/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sector: currentSector }),
      });
      router.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="grid h-8 w-8 place-items-center rounded bg-primary text-primary-foreground">
            <span className="text-xs font-bold">LI</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm">Lorinvest</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Intelligence
            </div>
          </div>
        </Link>

        <form
          onSubmit={submit}
          className="ml-4 flex w-full max-w-xl items-center gap-2"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no setor: titulo, conteudo, fonte..."
              className="pl-8"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <Settings2 className="h-4 w-4" />
              <span className="hidden md:inline">Admin</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")}
            />
            <span className="hidden md:inline">Atualizar Agora</span>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
