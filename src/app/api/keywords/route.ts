import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const createSchema = z.object({
  term: z.string().min(1).max(100),
});

export async function GET() {
  const keywords = await prisma.keyword.findMany({ orderBy: { term: "asc" } });
  return NextResponse.json(keywords);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const keyword = await prisma.keyword.create({ data: { term: parsed.data.term } });
  return NextResponse.json(keyword, { status: 201 });
}
