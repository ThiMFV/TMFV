import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { fetchFromRSS, fetchFromNewsAPI, deduplicateNews } from "@/lib/news/fetcher";
import { buildNewsletterHTML } from "@/lib/email/template";
import { sendNewsletter } from "@/lib/email/sender";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const keywords = await prisma.keyword.findMany({ where: { active: true } });
  const channels = await prisma.channel.findMany({ where: { active: true } });
  const subscribers = await prisma.subscriber.findMany({ where: { active: true } });

  if (!keywords.length || !subscribers.length) {
    return NextResponse.json({ message: "Sem keywords ou assinantes ativos" });
  }

  const keywordTerms = keywords.map((k) => k.term);
  const allArticles = [];

  for (const channel of channels) {
    if (channel.type === "RSS") {
      const items = await fetchFromRSS(channel.url, keywordTerms);
      allArticles.push(...items);
    } else if (channel.type === "NEWSAPI") {
      const items = await fetchFromNewsAPI(keywordTerms);
      allArticles.push(...items);
    }
  }

  const articles = deduplicateNews(allArticles).slice(0, 15);

  if (!articles.length) {
    return NextResponse.json({ message: "Nenhuma noticia encontrada" });
  }

  const title = `Newsletter Lorinvest - ${new Date().toLocaleDateString("pt-BR")}`;
  const subject = title;
  const html = buildNewsletterHTML(title, articles);

  const newsletter = await prisma.newsletter.create({
    data: {
      title,
      subject,
      htmlContent: html,
      status: "SENDING",
      articles: {
        create: articles.map((a) => ({
          title: a.title,
          description: a.description,
          url: a.url,
          source: a.source,
          publishedAt: a.publishedAt,
        })),
      },
    },
  });

  const emails = subscribers.map((s) => s.email);
  await sendNewsletter({ to: emails, subject, html });

  await prisma.newsletter.update({
    where: { id: newsletter.id },
    data: { status: "SENT", sentAt: new Date() },
  });

  return NextResponse.json({ success: true, newsletterId: newsletter.id });
}
