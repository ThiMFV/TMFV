import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(
  _: Request,
  { params }: { params: { id: string } },
) {
  const current = await prisma.newsItem.findUnique({
    where: { id: params.id },
    select: { favorited: true },
  });
  if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
  const updated = await prisma.newsItem.update({
    where: { id: params.id },
    data: { favorited: !current.favorited },
    select: { id: true, favorited: true },
  });
  return NextResponse.json(updated);
}
