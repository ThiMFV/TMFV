// Gera o seed em SQL puro a partir do mesmo conjunto de dados do seed.ts.
// Saida em /tmp/seed.sql para colar no SQL Editor do Neon.
import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const cuid = () => "c" + randomBytes(12).toString("hex");
const esc = (s: string) => s.replace(/'/g, "''");

type SeedTheme = {
  slug: string;
  name: string;
  kind: "PORTFOLIO" | "COMPETITOR" | "STANDARD" | "INTERNATIONAL" | "IMPORTANT";
  description?: string;
  keywords?: string[];
};

const baseColumns = (
  portfolio: string[],
  competitors: string[],
  product: string[],
  focus: string[],
): SeedTheme[] => [
  { slug: "portfolio", name: "Portfólio", kind: "PORTFOLIO", description: "Monitoramento das empresas investidas", keywords: portfolio },
  { slug: "concorrentes-parceiros", name: "Concorrentes e Parceiros", kind: "COMPETITOR", description: "Movimentos de concorrentes, parceiros e players de mercado", keywords: competitors },
  { slug: "produto-negocio", name: "Produto ou Negócio", kind: "STANDARD", description: "Termos técnicos do setor", keywords: product },
  { slug: "foco", name: "Foco", kind: "STANDARD", description: "Temas estratégicos temporários", keywords: focus },
  { slug: "internacional", name: "Internacional", kind: "INTERNATIONAL", description: "Notícias provenientes de veículos internacionais", keywords: [] },
  { slug: "importante", name: "Importante", kind: "IMPORTANT", description: "Notícias com marcação manual ou automática de alta relevância", keywords: [] },
];

const sectors = [
  { slug: "mineracao", name: "Mineração", description: "Mineração de bauxita, terras raras e operações industriais", themes: baseColumns(["New Wave"], ["Vale", "CBA", "Anglo American", "BHP", "Rio Tinto"], ["Bauxita", "Alumina", "Minério de ferro", "Lavra"], ["Terras Raras", "Crédito de Carbono", "Mineração ESG"]) },
  { slug: "navegacao", name: "Navegação", description: "Cabotagem, transporte marítimo e logística portuária", themes: baseColumns(["Norsul"], ["Log-In", "Hidrovias do Brasil", "Wilson Sons", "Maersk"], ["Cabotagem", "Frete marítimo", "Portos", "Contêiner"], ["Descarbonização naval", "Combustível verde", "IA Industrial"]) },
  { slug: "florestas", name: "Florestas", description: "Florestas plantadas, celulose e crédito de carbono florestal", themes: baseColumns(["Norflor"], ["Suzano", "Klabin", "Bracell", "CMPC"], ["Eucalipto", "Manejo florestal", "Celulose", "Madeira certificada"], ["Crédito de Carbono", "Restauração florestal", "Bioeconomia"]) },
  { slug: "gas-natural", name: "Gás Natural", description: "GNL, distribuição de gás e infraestrutura energética", themes: baseColumns(["GNLink"], ["Petrobras", "Comgás", "Cosan", "Eneva"], ["Gás Natural Liquefeito", "GNL", "Regaseificação", "Gasoduto"], ["Transição energética", "Hidrogênio verde", "Mercado de gás"]) },
  { slug: "mercado-financeiro", name: "Mercado Financeiro", description: "Bancos, fundos, investimentos e regulação financeira", themes: baseColumns(["Target Bank"], ["Bradesco BBI", "Itaú BBA", "XP", "BTG Pactual"], ["Selic", "Crédito", "Securitização", "Ibovespa"], ["Open Finance", "Tokenização", "IA em finanças"]) },
];

const sources = [
  { name: "Valor Econômico (Google News)", type: "GOOGLE_NEWS_RSS", url: "https://news.google.com/rss/search?q=valor+economico&hl=pt-BR&gl=BR&ceid=BR:pt-419", language: "pt", international: false },
  { name: "InfoMoney", type: "RSS", url: "https://www.infomoney.com.br/feed/", language: "pt", international: false },
  { name: "Reuters Brasil", type: "GOOGLE_NEWS_RSS", url: "https://news.google.com/rss/search?q=reuters+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419", language: "pt", international: false },
  { name: "Reuters World", type: "GOOGLE_NEWS_RSS", url: "https://news.google.com/rss/search?q=reuters+commodities&hl=en-US&gl=US&ceid=US:en", language: "en", international: true },
  { name: "Financial Times", type: "GOOGLE_NEWS_RSS", url: "https://news.google.com/rss/search?q=site:ft.com&hl=en-US&gl=US&ceid=US:en", language: "en", international: true },
  { name: "Bloomberg Commodities", type: "GOOGLE_NEWS_RSS", url: "https://news.google.com/rss/search?q=bloomberg+commodities&hl=en-US&gl=US&ceid=US:en", language: "en", international: true },
];

const out: string[] = [];
out.push("-- Seed Lorinvest Intelligence (idempotente via ON CONFLICT)\n");

sectors.forEach((s, idx) => {
  const sectorId = cuid();
  out.push(
    `INSERT INTO "Sector" ("id","slug","name","description","order","active","createdAt","updatedAt") VALUES ('${sectorId}','${s.slug}','${esc(s.name)}','${esc(s.description)}',${idx},true,NOW(),NOW()) ON CONFLICT ("slug") DO UPDATE SET "name"=EXCLUDED."name","description"=EXCLUDED."description","order"=EXCLUDED."order","updatedAt"=NOW() RETURNING "id";`,
  );
  // Para temas e keywords precisamos do id real do setor — usamos uma CTE
  s.themes.forEach((t, tIdx) => {
    const themeId = cuid();
    out.push(
      `WITH s AS (SELECT "id" FROM "Sector" WHERE "slug" = '${s.slug}') INSERT INTO "Theme" ("id","sectorId","slug","name","kind","description","order","active","createdAt","updatedAt") SELECT '${themeId}', s."id", '${t.slug}', '${esc(t.name)}', '${t.kind}'::"ThemeKind", '${esc(t.description || "")}', ${tIdx}, true, NOW(), NOW() FROM s ON CONFLICT ("sectorId","slug") DO UPDATE SET "name"=EXCLUDED."name","kind"=EXCLUDED."kind","description"=EXCLUDED."description","order"=EXCLUDED."order","updatedAt"=NOW();`,
    );
    (t.keywords ?? []).forEach((term) => {
      const kwId = cuid();
      out.push(
        `WITH t AS (SELECT t."id" FROM "Theme" t JOIN "Sector" s ON s."id"=t."sectorId" WHERE s."slug"='${s.slug}' AND t."slug"='${t.slug}') INSERT INTO "Keyword" ("id","themeId","term","requireAll","excludeAny","titleOnly","active","createdAt","updatedAt") SELECT '${kwId}', t."id", '${esc(term)}', ARRAY[]::text[], ARRAY[]::text[], false, true, NOW(), NOW() FROM t ON CONFLICT ("themeId","term") DO NOTHING;`,
      );
    });
  });
});

sources.forEach((src) => {
  const id = cuid();
  out.push(
    `INSERT INTO "Source" ("id","name","type","url","language","international","active","status","fetchCount","errorStreak","createdAt","updatedAt") VALUES ('${id}','${esc(src.name)}','${src.type}'::"SourceType",'${src.url}','${src.language}',${src.international},true,'UNKNOWN'::"SourceStatus",0,0,NOW(),NOW()) ON CONFLICT ("url") DO UPDATE SET "name"=EXCLUDED."name","type"=EXCLUDED."type","language"=EXCLUDED."language","international"=EXCLUDED."international","updatedAt"=NOW();`,
  );
});

const userId = cuid();
out.push(
  `INSERT INTO "User" ("id","email","name","role","active","createdAt","updatedAt") VALUES ('${userId}','admin@lorinvest.com.br','Administrador Lorinvest','ADMIN'::"UserRole",true,NOW(),NOW()) ON CONFLICT ("email") DO UPDATE SET "role"='ADMIN'::"UserRole","updatedAt"=NOW();`,
);

writeFileSync("/tmp/seed.sql", out.join("\n") + "\n");
console.log("Generated /tmp/seed.sql with", out.length, "statements");
