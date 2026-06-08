import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runIngestion } from "@/lib/ingest/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  let sectorSlug: string | undefined;
  try {
    const body = (await req.json().catch(() => ({}))) as { sector?: string };
    sectorSlug = body.sector;
  } catch {
    /* noop */
  }

  // Quando vier um setor especifico, executa apenas as fontes associadas.
  let sourceIds: string[] | undefined;
  if (sectorSlug) {
    const sector = await prisma.sector.findUnique({
      where: { slug: sectorSlug },
      select: { id: true },
    });
    if (sector) {
      const rels = await prisma.sourceSector.findMany({
        where: { sectorId: sector.id },
        select: { sourceId: true },
      });
      sourceIds = rels.map((r) => r.sourceId);
    }
  }

  if (sourceIds && sourceIds.length === 0) {
    // Sem fontes vinculadas: roda todas as ativas (fontes globais).
    sourceIds = undefined;
  }

  const results = [];
  if (sourceIds && sourceIds.length > 0) {
    for (const id of sourceIds) {
      results.push(await runIngestion({ sourceId: id, triggeredBy: "manual" }));
    }
  } else {
    results.push(await runIngestion({ triggeredBy: "manual" }));
  }

  const aggregated = results.reduce(
    (acc, r) => ({
      sourcesProcessed: acc.sourcesProcessed + r.sourcesProcessed,
      itemsFound: acc.itemsFound + r.itemsFound,
      itemsNew: acc.itemsNew + r.itemsNew,
      errors: acc.errors + r.errors,
    }),
    { sourcesProcessed: 0, itemsFound: 0, itemsNew: 0, errors: 0 },
  );

  return NextResponse.json({ ok: true, result: aggregated });
}
