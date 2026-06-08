import { prisma } from "@/lib/db";
import { SourcesManager } from "./sources-manager";

export const dynamic = "force-dynamic";

export default async function SourcesAdmin() {
  const [sources, sectors] = await Promise.all([
    prisma.source.findMany({
      include: { sectors: true },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    prisma.sector.findMany({
      orderBy: { order: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Fontes</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre RSS, Google News RSS, NewsAPI, scraping ou fontes manuais.
          Associe fontes a setores para limitar a classificação.
        </p>
      </header>
      <SourcesManager sources={sources} sectors={sectors} />
    </div>
  );
}
