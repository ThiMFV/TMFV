import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckResult = {
  table: string;
  ok: boolean;
  count?: number;
  error?: string;
};

export async function GET() {
  const results: CheckResult[] = [];

  const tables: { name: string; run: () => Promise<number> }[] = [
    { name: "Sector", run: () => prisma.sector.count() },
    { name: "Theme", run: () => prisma.theme.count() },
    { name: "Keyword", run: () => prisma.keyword.count() },
    { name: "Source", run: () => prisma.source.count() },
    { name: "SourceSector", run: () => prisma.sourceSector.count() },
    { name: "NewsItem", run: () => prisma.newsItem.count() },
    { name: "NewsClassification", run: () => prisma.newsClassification.count() },
    { name: "IngestionRun", run: () => prisma.ingestionRun.count() },
    { name: "User", run: () => prisma.user.count() },
  ];

  for (const t of tables) {
    try {
      const count = await t.run();
      results.push({ table: t.name, ok: true, count });
    } catch (e) {
      results.push({
        table: t.name,
        ok: false,
        error: (e as Error).message.slice(0, 400),
      });
    }
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    {
      ok: allOk,
      databaseUrl: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":***@")
        : "missing",
      results,
    },
    { status: allOk ? 200 : 500 },
  );
}
