import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const [sources, runs] = await Promise.all([
    prisma.source.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    }),
    prisma.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 30,
      include: { source: { select: { name: true } } },
    }),
  ]);

  const offline = sources.filter((s) => s.status === "OFFLINE");
  const online = sources.filter((s) => s.status === "ONLINE");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Saúde das fontes
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitoramento operacional das fontes cadastradas. Alertas são gerados
          quando uma fonte deixa de responder.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard
          label="Online"
          value={online.length}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        />
        <StatCard
          label="Offline"
          value={offline.length}
          icon={<AlertTriangle className="h-4 w-4 text-rose-500" />}
        />
        <StatCard label="Total" value={sources.length} icon={null} />
      </div>

      {offline.length > 0 && (
        <Card className="border-rose-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-4 w-4" /> Fontes com falha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="text-left">
                  <th className="pb-2">Fonte</th>
                  <th className="pb-2">Falhas consecutivas</th>
                  <th className="pb-2">Último erro</th>
                  <th className="pb-2">Mensagem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {offline.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2 font-medium">{s.name}</td>
                    <td className="py-2">{s.errorStreak}</td>
                    <td className="py-2 text-muted-foreground">
                      {s.lastErrorAt
                        ? formatRelative(s.lastErrorAt)
                        : "—"}
                    </td>
                    <td className="max-w-md truncate py-2 text-rose-500">
                      {s.lastError ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Status detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="text-left">
                <th className="pb-2">Fonte</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Última coleta</th>
                <th className="pb-2">Fetchs</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sources.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2 text-muted-foreground">{s.type}</td>
                  <td className="py-2 text-muted-foreground">
                    {s.lastSuccessAt ? formatRelative(s.lastSuccessAt) : "—"}
                  </td>
                  <td className="py-2 text-muted-foreground">{s.fetchCount}</td>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas execuções</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground">
              <tr className="text-left">
                <th className="pb-2">Fonte</th>
                <th className="pb-2">Quando</th>
                <th className="pb-2">Duração</th>
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
                    {formatRelative(r.startedAt)}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {r.finishedAt
                      ? `${Math.round(
                          (r.finishedAt.getTime() - r.startedAt.getTime()) /
                            1000,
                        )}s`
                      : "…"}
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
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
