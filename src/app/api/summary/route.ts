import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIOD_DAYS: Record<string, number> = {
  "24h": 1,
  "7d": 7,
  "30d": 30,
  "6m": 180,
  "1y": 365,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sectorSlug = url.searchParams.get("sector");
  const period = url.searchParams.get("period") ?? "24h";

  const since = new Date();
  since.setDate(since.getDate() - (PERIOD_DAYS[period] ?? 1));

  const where = {
    archived: false,
    publishedAt: { gte: since },
    ...(sectorSlug
      ? {
          classifications: {
            some: { theme: { sector: { slug: sectorSlug } } },
          },
        }
      : {}),
  };

  const items = await prisma.newsItem.findMany({
    where,
    orderBy: [
      { relevance: { sort: "desc", nulls: "last" } },
      { publishedAt: "desc" },
    ],
    take: 15,
    include: { source: { select: { name: true } } },
  });

  if (items.length === 0) {
    return NextResponse.json({
      summary: "Sem notícias no período selecionado.",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const fallback = items
      .map(
        (n, i) =>
          `${i + 1}. ${n.title}\n   ${n.source.name} · ${n.publishedAt.toLocaleString("pt-BR")}`,
      )
      .join("\n\n");
    return NextResponse.json({
      summary: `Resumo IA desativado (ANTHROPIC_API_KEY ausente). Top ${items.length} notícias:\n\n${fallback}`,
    });
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

  const bullets = items
    .map(
      (n, i) =>
        `${i + 1}. [${n.source.name}] ${n.title}${n.aiSummary ? ` — ${n.aiSummary}` : ""}`,
    )
    .join("\n");

  try {
    const res = await client.messages.create({
      model,
      max_tokens: 800,
      system:
        "Voce e analista da holding Lorinvest. Receba uma lista de noticias e produza um resumo executivo em portugues com no maximo 8 bullets, agrupando temas relacionados. Comece com 1 linha do panorama geral. Foque no que importa para a tese de investimentos.",
      messages: [
        {
          role: "user",
          content: `Setor: ${sectorSlug ?? "geral"}\nPeriodo: ${period}\n\nNoticias:\n${bullets}`,
        },
      ],
    });

    const text = res.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();

    return NextResponse.json({ summary: text });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
