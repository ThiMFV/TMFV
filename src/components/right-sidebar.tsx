"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Clock, FileText, BookmarkPlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarWidget } from "@/components/calendar-widget";

type Selection = { name: string; query: string };

const STORAGE_KEY = "lorinvest:selections";

export function RightSidebar({ sectorSlug }: { sectorSlug: string }) {
  return (
    <aside className="space-y-3">
      <CalendarWidget />
      <LatestNewsBlock />
      <SummaryBlock sectorSlug={sectorSlug} />
      <SelectionsBlock />
    </aside>
  );
}

function LatestNewsBlock() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <Button
      onClick={() => {
        const usp = new URLSearchParams();
        usp.set("period", "24h");
        router.push(`${pathname}?${usp.toString()}`);
      }}
      className="w-full justify-start gap-2"
      variant="outline"
    >
      <Clock className="h-4 w-4" /> Últimas notícias
    </Button>
  );
}

function SummaryBlock({ sectorSlug }: { sectorSlug: string }) {
  const params = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const usp = new URLSearchParams();
      usp.set("sector", sectorSlug);
      const period = params.get("period");
      if (period) usp.set("period", period);
      const res = await fetch(`/api/summary?${usp.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar resumo");
      setSummary(data.summary);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <header className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider">
        Resumo IA
      </header>
      <div className="space-y-2 p-3">
        <p className="text-[11px] leading-snug text-muted-foreground">
          Resumo executivo das notícias visíveis (top 10 do período filtrado).
        </p>
        <Button
          onClick={generate}
          disabled={loading}
          size="sm"
          className="w-full gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {loading ? "Gerando…" : "Carregar resumo"}
        </Button>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {summary && (
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded border bg-muted/30 p-2 text-xs leading-relaxed scrollbar-thin">
            {summary}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectionsBlock() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [selections, setSelections] = React.useState<Selection[]>([]);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSelections(JSON.parse(raw));
    } catch {
      /* noop */
    }
  }, []);

  const persist = (next: Selection[]) => {
    setSelections(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  const save = () => {
    if (!name.trim()) return;
    const next = [
      ...selections.filter((s) => s.name !== name),
      { name: name.trim(), query: params.toString() },
    ];
    persist(next);
    setName("");
  };

  const remove = (n: string) => persist(selections.filter((s) => s.name !== n));

  const load = (s: Selection) => router.push(`${pathname}?${s.query}`);

  return (
    <div className="rounded-md border bg-card">
      <header className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider">
        Seleções
      </header>
      <div className="space-y-2 p-3">
        <p className="text-[11px] leading-snug text-muted-foreground">
          Salve os filtros aplicados agora para recarregar depois.
        </p>
        <div className="flex gap-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da seleção"
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <Button
            onClick={save}
            disabled={!name.trim()}
            size="sm"
            className="h-8 px-2"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y rounded border">
          {selections.length === 0 && (
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
              Nenhuma seleção salva
            </div>
          )}
          {selections.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between gap-1 px-2 py-1.5 text-xs"
            >
              <button
                type="button"
                onClick={() => load(s)}
                className="truncate text-left hover:underline"
              >
                {s.name}
              </button>
              <button
                type="button"
                onClick={() => remove(s.name)}
                className="text-muted-foreground hover:text-rose-500"
                aria-label="Remover"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
