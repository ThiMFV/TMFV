import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingest/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev sem secret -> libera
  const auth = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  return auth === `Bearer ${secret}` || token === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runIngestion({ triggeredBy: "cron" });
  return NextResponse.json({ ok: true, result });
}
