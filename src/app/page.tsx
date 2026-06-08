import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const first = await prisma.sector
    .findFirst({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { slug: true },
    })
    .catch(() => null);

  redirect(`/intelligence/${first?.slug ?? "mineracao"}`);
}
