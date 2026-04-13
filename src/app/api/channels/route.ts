import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["RSS", "NEWSAPI"]),
  url: z.string().url(),
});

export async function GET() {
  const channels = await prisma.channel.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(channels);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const channel = await prisma.channel.create({ data: parsed.data });
  return NextResponse.json(channel, { status: 201 });
}
