"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Keyword = {
  id: string;
  term: string;
  requireAll: string[];
  excludeAny: string[];
  titleOnly: boolean;
  active: boolean;
};
type Theme = {
  id: string;
  name: string;
  kind: string;
  keywords: Keyword[];
};
type Sector = {
  id: string;
  name: string;
  slug: string;
  themes: Theme[];
};

export function KeywordsManager({ sectors }: { sectors: Sector[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const addKeyword = async (themeId: string, term: string) => {
    const t = term.trim();
    if (!t) return;
    const parts = t.split(/\s+AND\s+/i);
    const main = parts[0];
    const requireAll = parts.slice(1);
    const notMatch = main.match(/\s+NOT\s+(.+)$/i);
    let core = main;
    const excludeAny: string[] = [];
    if (notMatch) {
      core = main.replace(/\s+NOT\s+.+$/i, "").trim();
      excludeAny.push(notMatch[1].trim());
    }
    await fetch("/api/keywords", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        themeId,
        term: core,
        requireAll,
        excludeAny,
      }),
    });
    startTransition(() => router.refresh());
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm("Excluir palavra-chave?")) return;
    await fetch(`/api/keywords/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  };

  return (
    <div className="space-y-6">
      {sectors.map((sector) => (
        <Card key={sector.id}>
          <CardHeader>
            <CardTitle>{sector.name}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {sector.themes
              .filter((t) => t.kind !== "IMPORTANT" && t.kind !== "INTERNATIONAL")
              .map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  onAdd={(term) => addKeyword(theme.id, term)}
                  onDelete={deleteKeyword}
                  busy={pending}
                />
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ThemeCard({
  theme,
  onAdd,
  onDelete,
  busy,
}: {
  theme: Theme;
  onAdd: (term: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  busy: boolean;
}) {
  const [value, setValue] = React.useState("");
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{theme.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {theme.kind === "PORTFOLIO" && "Exclusiva — Regra 1"}
            {theme.kind === "COMPETITOR" && "Exclusiva — Regra 2"}
            {theme.kind === "STANDARD" && "Compartilha notícias entre colunas"}
          </div>
        </div>
        <Badge variant="muted">{theme.keywords.length}</Badge>
      </div>
      <form
        className="mb-3 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await onAdd(value);
          setValue("");
        }}
      >
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='ex.: "Vale" ou "Vale AND mineração" ou "Vale NOT churrasco"'
          className="text-xs"
        />
        <Button type="submit" size="sm" disabled={busy}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {theme.keywords.map((k) => (
          <span
            key={k.id}
            className="group inline-flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-xs"
          >
            <span className="font-medium">{k.term}</span>
            {k.requireAll.length > 0 && (
              <span className="text-muted-foreground">
                {" "}
                AND {k.requireAll.join(" AND ")}
              </span>
            )}
            {k.excludeAny.length > 0 && (
              <span className="text-rose-500">
                {" "}
                NOT {k.excludeAny.join(", ")}
              </span>
            )}
            <button
              type="button"
              onClick={() => onDelete(k.id)}
              className="opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
              aria-label="Remover"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {theme.keywords.length === 0 && (
          <span className="text-xs text-muted-foreground">
            Sem palavras-chave.
          </span>
        )}
      </div>
    </div>
  );
}
