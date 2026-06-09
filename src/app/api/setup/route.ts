import { NextResponse } from "next/server";
import { Client } from "pg";
import { schemaSql, seedSql } from "@/lib/setup/sql";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  return auth === `Bearer ${secret}` || token === secret;
}

async function runSetup(opts: { resetSchema: boolean }) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ausente");

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    if (opts.resetSchema) {
      // pg.Client.query aceita SQL com multiplos statements.
      await client.query(schemaSql);
    }
    await client.query(seedSql);
  } finally {
    await client.end();
  }
}

export async function POST(req: Request) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") ?? "auto";

  try {
    const resetSchema = mode === "full" || mode === "auto";
    await runSetup({ resetSchema });

    const [sectors, themes, keywords, sources, users] = await Promise.all([
      prisma.sector.count(),
      prisma.theme.count(),
      prisma.keyword.count(),
      prisma.source.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      ok: true,
      counts: { sectors, themes, keywords, sources, users },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
