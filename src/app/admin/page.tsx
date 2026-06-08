import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [sectors, themes, sources, keywords, news, runs] = await Promise.all([
    prisma.sector.count(),
    prisma.theme.count(),
    prisma.source.count(),
    prisma.keyword.count(),
    prisma.newsItem.count(),
    prisma.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { source: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "Setores", value: sectors, href: "/admin/sectors" },
    { label: "Temas", value: themes, href: "/admin/sectors" },
    { label: "Fontes", value: sources, href: "/admin/sources" },
    { label: "Palavras-chave", value: keywords, href: "/admin/keywords" },
    { label: "Notícias indexadas", value: news, href: "/dashboard" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Administração</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de setores, fontes, palavras-chave e operação da plataforma.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-colors hover:bg-accent/40">
              <CardContent className="p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-1 text-2xl font-semibold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas execuções de ingestão</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="text-left">
                <th className="pb-2">Fonte</th>
                <th className="pb-2">Quando</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Itens</th>
                <th className="pb-2 text-right">Novos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-2">{r.source?.name ?? "—"}</td>
                  <td className="py-2 text-muted-foreground">
                    {r.startedAt.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-2">
                    <Badge
                      variant={
                        r.status === "SUCCESS"
                          ? "success"
                          : r.status === "ERROR"
                            ? "danger"
                            : "muted"
                      }
                    >
                      {r.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">{r.itemsFound}</td>
                  <td className="py-2 text-right font-medium">{r.itemsNew}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nenhuma execução registrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
