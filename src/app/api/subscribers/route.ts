import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function GET() {
  const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(subscribers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const subscriber = await prisma.subscriber.create({ data: parsed.data });
  return NextResponse.json(subscriber, { status: 201 });
}
