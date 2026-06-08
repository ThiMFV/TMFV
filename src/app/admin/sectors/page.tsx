import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function SectorsAdmin() {
  const sectors = await prisma.sector.findMany({
    orderBy: { order: "asc" },
    include: {
      themes: {
        orderBy: { order: "asc" },
        include: { _count: { select: { keywords: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Setores e Temas</h1>
        <p className="text-sm text-muted-foreground">
          Visualização da estrutura. CRUD via APIs <code>/api/sectors</code> e{" "}
          <code>/api/themes</code>.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {sectors.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {s.name}
                <span className="text-xs text-muted-foreground">{s.slug}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-1.5">
                {s.themes.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded border px-2 py-1.5 text-sm"
                  >
                    <span>
                      <span className="font-medium">{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t.kind}
                      </span>
                    </span>
                    <Badge variant="muted">
                      {t._count.keywords} keywords
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
