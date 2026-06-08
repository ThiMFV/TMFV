"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Eraser, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "24h", label: "Últimas 24h" },
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

const GROUP_BY = [
  { value: "theme", label: "Tema" },
  { value: "keyword", label: "Palavra-chave" },
  { value: "source", label: "Fonte" },
  { value: "none", label: "Não agrupar" },
];

type Option = { value: string; label: string };

export function FilterPanel({
  themes,
  keywords,
  sources,
}: {
  themes: Option[];
  keywords: Option[];
  sources: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [open, setOpen] = React.useState(true);
  const [advanced, setAdvanced] = React.useState(false);
  const [query, setQuery] = React.useState(params.get("q") ?? "");
  const [dateFrom, setDateFrom] = React.useState(params.get("from") ?? "");
  const [dateTo, setDateTo] = React.useState(params.get("to") ?? "");
  const [selectedThemes, setSelectedThemes] = React.useState<string[]>(
    params.getAll("theme"),
  );
  const [selectedKeywords, setSelectedKeywords] = React.useState<string[]>(
    params.getAll("kw"),
  );
  const [selectedSources, setSelectedSources] = React.useState<string[]>(
    params.getAll("source"),
  );

  const period = params.get("period") ?? "7d";
  const sort = params.get("sort") ?? "recent";
  const groupBy = params.get("group") ?? "theme";

  const apply = (overrides?: Record<string, string | string[] | undefined>) => {
    const usp = new URLSearchParams();
    const set = (key: string, value?: string | null) => {
      if (value && value.length > 0) usp.set(key, value);
    };
    const setMulti = (key: string, values?: string[]) => {
      (values ?? []).forEach((v) => v && usp.append(key, v));
    };

    const data = {
      q: query || undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
      period,
      sort,
      group: groupBy,
      theme: selectedThemes,
      kw: selectedKeywords,
      source: selectedSources,
      ...overrides,
    };

    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) setMulti(k, v);
      else set(k, v as string | undefined);
    });
    router.push(`${pathname}?${usp.toString()}`);
  };

  const clear = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
    setSelectedThemes([]);
    setSelectedKeywords([]);
    setSelectedSources([]);
    router.push(pathname);
  };

  const setParam = (key: string, value: string) => {
    const usp = new URLSearchParams(params.toString());
    usp.set(key, value);
    router.push(`${pathname}?${usp.toString()}`);
  };

  return (
    <section className="overflow-hidden rounded-md border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b bg-muted/40 px-4 py-2 text-left text-sm font-semibold"
      >
        <span>Filtros</span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="space-y-4 p-4">
          <Field label="Buscar">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder="Busca no título, subtítulo ou texto da notícia"
                className="pl-8"
              />
            </div>
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Período
            </span>
            {PERIODS.map((p) => (
              <Pill
                key={p.value}
                active={period === p.value}
                onClick={() => setParam("period", p.value)}
              >
                {p.label}
              </Pill>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className="flex w-full items-center justify-between border-t pt-3 text-sm font-semibold"
          >
            <span>Busca avançada</span>
            <span className="text-xs font-normal text-muted-foreground">
              (Clique para {advanced ? "recolher" : "expandir"})
            </span>
          </button>

          {advanced && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Data inicial">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Field>
              <Field label="Data final">
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Field>

              <MultiSelect
                label="Temas"
                options={themes}
                selected={selectedThemes}
                onChange={setSelectedThemes}
              />
              <MultiSelect
                label="Palavras-chave"
                options={keywords}
                selected={selectedKeywords}
                onChange={setSelectedKeywords}
              />
              <MultiSelect
                label="Fontes"
                options={sources}
                selected={selectedSources}
                onChange={setSelectedSources}
              />
            </div>
          )}

          <div className="grid gap-4 border-t pt-3 md:grid-cols-2">
            <Field label="Agrupar por">
              <Select
                value={groupBy}
                onChange={(v) => setParam("group", v)}
                options={GROUP_BY}
              />
            </Field>
            <Field label="Ordenar por">
              <Select
                value={sort}
                onChange={(v) => setParam("sort", v)}
                options={SORTS}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" onClick={clear}>
              <Eraser className="h-4 w-4" /> Limpar
            </Button>
            <Button size="sm" onClick={() => apply()}>
              <Search className="h-4 w-4" /> Buscar
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full border px-3 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [filter, setFilter] = React.useState("");
  const visible = options.filter((o) =>
    o.label.toLowerCase().includes(filter.toLowerCase()),
  );
  const toggle = (v: string) =>
    onChange(
      selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v],
    );
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onChange([])}
          >
            limpar
          </button>
        )}
      </div>
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={`Filtrar ${label.toLowerCase()}…`}
        className="h-8 text-xs"
      />
      <div className="max-h-32 overflow-y-auto rounded-md border bg-background scrollbar-thin">
        {visible.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Sem opções
          </div>
        )}
        {visible.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-center gap-2 px-2 py-1 text-xs hover:bg-accent"
          >
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
              className="h-3.5 w-3.5"
            />
            <span className="truncate">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
