"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Power, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Source = {
  id: string;
  name: string;
  type: string;
  url: string;
  language: string;
  international: boolean;
  active: boolean;
  status: string;
  sectors: { sectorId: string }[];
};
type Sector = { id: string; name: string; slug: string };

const TYPES = [
  "RSS",
  "NEWSAPI",
  "GNEWS",
  "GOOGLE_NEWS_RSS",
  "SCRAPER",
  "MANUAL",
] as const;

export function SourcesManager({
  sources,
  sectors,
}: {
  sources: Source[];
  sectors: Sector[];
}) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    name: "",
    url: "",
    type: "RSS" as (typeof TYPES)[number],
    language: "pt",
    international: false,
    sectorIds: [] as string[],
  });
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm({
        name: "",
        url: "",
        type: "RSS",
        language: "pt",
        international: false,
        sectorIds: [],
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (s: Source) => {
    await fetch(`/api/sources/${s.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !s.active }),
    });
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir fonte? As notícias indexadas não serão removidas."))
      return;
    await fetch(`/api/sources/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova fonte</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-6">
            <Input
              required
              placeholder="Nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="md:col-span-2"
            />
            <Input
              required
              placeholder="URL (RSS / API)"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="md:col-span-3"
            />
            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value as (typeof TYPES)[number],
                })
              }
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Input
              placeholder="Idioma (pt, en...)"
              value={form.language}
              onChange={(e) =>
                setForm({ ...form, language: e.target.value })
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.international}
                onChange={(e) =>
                  setForm({ ...form, international: e.target.checked })
                }
              />
              Internacional
            </label>
            <select
              multiple
              value={form.sectorIds}
              onChange={(e) =>
                setForm({
                  ...form,
                  sectorIds: Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  ),
                })
              }
              className="h-20 rounded-md border bg-background px-2 text-sm md:col-span-3"
            >
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button
              type="submit"
              className="md:col-span-6"
              disabled={busy}
            >
              <Plus className="h-4 w-4" /> Cadastrar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fontes cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="text-left">
                <th className="pb-2">Nome</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">URL</th>
                <th className="pb-2">Idioma</th>
                <th className="pb-2">Setores</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sources.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-medium">
                    {s.name}
                    {s.international && (
                      <Globe className="ml-1 inline h-3 w-3 text-violet-500" />
                    )}
                  </td>
                  <td className="py-2 text-muted-foreground">{s.type}</td>
                  <td className="max-w-[260px] truncate py-2 text-muted-foreground">
                    {s.url}
                  </td>
                  <td className="py-2 uppercase text-muted-foreground">
                    {s.language}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {s.sectors.length
                      ? s.sectors
                          .map(
                            (rel) =>
                              sectors.find((x) => x.id === rel.sectorId)?.name,
                          )
                          .filter(Boolean)
                          .join(", ")
                      : "todos"}
                  </td>
                  <td className="py-2">
                    <Badge
                      variant={
                        s.status === "ONLINE"
                          ? "success"
                          : s.status === "OFFLINE"
                            ? "danger"
                            : s.status === "DEGRADED"
                              ? "warning"
                              : "muted"
                      }
                    >
                      {s.status}
                    </Badge>
                    {!s.active && (
                      <Badge variant="muted" className="ml-1">
                        inativo
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(s)}
                      title={s.active ? "Desativar" : "Ativar"}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(s.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
