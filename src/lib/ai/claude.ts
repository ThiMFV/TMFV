import Anthropic from "@anthropic-ai/sdk";
import { NewsCategory, Sentiment } from "@prisma/client";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const client = apiKey ? new Anthropic({ apiKey }) : null;

export type Enrichment = {
  summary: string;
  insight: string;
  category: NewsCategory;
  sentiment: Sentiment;
  relevance: number; // 0-100
};

const CATEGORIES: NewsCategory[] = [
  "MARKET",
  "COMPETITION",
  "REGULATION",
  "ESG",
  "INVESTMENTS",
  "OPERATIONS",
  "TECHNOLOGY",
];
const SENTIMENTS: Sentiment[] = ["POSITIVE", "NEUTRAL", "NEGATIVE"];

const SYSTEM_PROMPT = `Voce e um analista senior do grupo Lorinvest, holding com participacoes em mineracao, navegacao (cabotagem), florestas plantadas, gas natural e mercado financeiro.

Sua tarefa: ler uma noticia e devolver UM unico objeto JSON com os campos:
- summary (string, portugues, ate 3 linhas, executivo, sem floreios)
- insight (string, portugues, 1 frase respondendo "por que essa noticia importa para a Lorinvest?")
- category (uma de: MARKET, COMPETITION, REGULATION, ESG, INVESTMENTS, OPERATIONS, TECHNOLOGY)
- sentiment (POSITIVE, NEUTRAL ou NEGATIVE - sob a otica das empresas investidas)
- relevance (inteiro 0-100, quao critica essa noticia e para a tese da Lorinvest)

Retorne SOMENTE JSON valido, sem markdown, sem comentarios.`;

export async function enrichNews(input: {
  title: string;
  excerpt?: string | null;
  rawContent?: string | null;
  source?: string | null;
  sector?: string | null;
  matchedTerms?: string[];
}): Promise<Enrichment | null> {
  if (!client) return null;

  const body = [
    `Setor monitorado: ${input.sector ?? "n/a"}`,
    `Fonte: ${input.source ?? "n/a"}`,
    `Palavras-chave que casaram: ${(input.matchedTerms ?? []).join(", ") || "n/a"}`,
    "",
    `Titulo: ${input.title}`,
    "",
    "Conteudo:",
    (input.rawContent || input.excerpt || "").slice(0, 6000),
  ].join("\n");

  try {
    const res = await client.messages.create({
      model,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: body }],
    });

    const text = res.content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    const category = CATEGORIES.includes(parsed.category)
      ? (parsed.category as NewsCategory)
      : "MARKET";
    const sentiment = SENTIMENTS.includes(parsed.sentiment)
      ? (parsed.sentiment as Sentiment)
      : "NEUTRAL";
    const relevance = Math.max(
      0,
      Math.min(100, Math.round(Number(parsed.relevance ?? 0))),
    );

    return {
      summary: String(parsed.summary ?? "").trim(),
      insight: String(parsed.insight ?? "").trim(),
      category,
      sentiment,
      relevance,
    };
  } catch (err) {
    console.error("[ai] enrich failed:", (err as Error).message);
    return null;
  }
}

export const aiEnabled = !!client;
