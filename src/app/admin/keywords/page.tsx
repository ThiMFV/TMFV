import { prisma } from "@/lib/db";
import { KeywordsManager } from "./keywords-manager";

export const dynamic = "force-dynamic";

export default async function KeywordsAdmin() {
  const sectors = await prisma.sector.findMany({
    orderBy: { order: "asc" },
    include: {
      themes: {
        orderBy: { order: "asc" },
        include: {
          keywords: { orderBy: { term: "asc" } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Palavras-chave</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre os termos que alimentam cada coluna. Suporta combinações
          booleanas (AND) e exclusões (NOT). Termos no título marcam como
          importante automaticamente.
        </p>
      </header>
      <KeywordsManager sectors={sectors} />
    </div>
  );
}
