import { PrismaClient, ThemeKind, SourceType } from "@prisma/client";

const prisma = new PrismaClient();

type SeedTheme = {
  slug: string;
  name: string;
  kind: ThemeKind;
  keywords?: string[];
  description?: string;
};

type SeedSector = {
  slug: string;
  name: string;
  description: string;
  themes: SeedTheme[];
};

// Estrutura padrao de colunas (temas) por setor, conforme spec Lorinvest.
const baseColumns = (
  portfolio: string[],
  competitors: string[],
  product: string[],
  focus: string[],
): SeedTheme[] => [
  {
    slug: "portfolio",
    name: "Portfólio",
    kind: ThemeKind.PORTFOLIO,
    description: "Monitoramento das empresas investidas",
    keywords: portfolio,
  },
  {
    slug: "concorrentes-parceiros",
    name: "Concorrentes e Parceiros",
    kind: ThemeKind.COMPETITOR,
    description: "Movimentos de concorrentes, parceiros e players de mercado",
    keywords: competitors,
  },
  {
    slug: "produto-negocio",
    name: "Produto ou Negócio",
    kind: ThemeKind.STANDARD,
    description: "Termos técnicos do setor",
    keywords: product,
  },
  {
    slug: "foco",
    name: "Foco",
    kind: ThemeKind.STANDARD,
    description: "Temas estratégicos temporários",
    keywords: focus,
  },
  {
    slug: "internacional",
    name: "Internacional",
    kind: ThemeKind.INTERNATIONAL,
    description: "Notícias provenientes de veículos internacionais",
    keywords: [],
  },
  {
    slug: "importante",
    name: "Importante",
    kind: ThemeKind.IMPORTANT,
    description:
      "Notícias com marcação manual ou automática de alta relevância",
    keywords: [],
  },
];

const sectors: SeedSector[] = [
  {
    slug: "mineracao",
    name: "Mineração",
    description: "Mineração de bauxita, terras raras e operações industriais",
    themes: baseColumns(
      ["New Wave"],
      ["Vale", "CBA", "Anglo American", "BHP", "Rio Tinto"],
      ["Bauxita", "Alumina", "Minério de ferro", "Lavra"],
      ["Terras Raras", "Crédito de Carbono", "Mineração ESG"],
    ),
  },
  {
    slug: "navegacao",
    name: "Navegação",
    description: "Cabotagem, transporte marítimo e logística portuária",
    themes: baseColumns(
      ["Norsul"],
      ["Log-In", "Hidrovias do Brasil", "Wilson Sons", "Maersk"],
      ["Cabotagem", "Frete marítimo", "Portos", "Contêiner"],
      ["Descarbonização naval", "Combustível verde", "IA Industrial"],
    ),
  },
  {
    slug: "florestas",
    name: "Florestas",
    description: "Florestas plantadas, celulose e crédito de carbono florestal",
    themes: baseColumns(
      ["Norflor"],
      ["Suzano", "Klabin", "Bracell", "CMPC"],
      ["Eucalipto", "Manejo florestal", "Celulose", "Madeira certificada"],
      ["Crédito de Carbono", "Restauração florestal", "Bioeconomia"],
    ),
  },
  {
    slug: "gas-natural",
    name: "Gás Natural",
    description: "GNL, distribuição de gás e infraestrutura energética",
    themes: baseColumns(
      ["GNLink"],
      ["Petrobras", "Comgás", "Cosan", "Eneva"],
      ["Gás Natural Liquefeito", "GNL", "Regaseificação", "Gasoduto"],
      ["Transição energética", "Hidrogênio verde", "Mercado de gás"],
    ),
  },
  {
    slug: "mercado-financeiro",
    name: "Mercado Financeiro",
    description: "Bancos, fundos, investimentos e regulação financeira",
    themes: baseColumns(
      ["Target Bank"],
      ["Bradesco BBI", "Itaú BBA", "XP", "BTG Pactual"],
      ["Selic", "Crédito", "Securitização", "Ibovespa"],
      ["Open Finance", "Tokenização", "IA em finanças"],
    ),
  },
];

const sources = [
  {
    name: "Valor Econômico (Google News)",
    type: SourceType.GOOGLE_NEWS_RSS,
    url: "https://news.google.com/rss/search?q=valor+economico&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    language: "pt",
    international: false,
  },
  {
    name: "InfoMoney",
    type: SourceType.RSS,
    url: "https://www.infomoney.com.br/feed/",
    language: "pt",
    international: false,
  },
  {
    name: "Reuters Brasil",
    type: SourceType.GOOGLE_NEWS_RSS,
    url: "https://news.google.com/rss/search?q=reuters+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
    language: "pt",
    international: false,
  },
  {
    name: "Reuters World",
    type: SourceType.GOOGLE_NEWS_RSS,
    url: "https://news.google.com/rss/search?q=reuters+commodities&hl=en-US&gl=US&ceid=US:en",
    language: "en",
    international: true,
  },
  {
    name: "Financial Times",
    type: SourceType.GOOGLE_NEWS_RSS,
    url: "https://news.google.com/rss/search?q=site:ft.com&hl=en-US&gl=US&ceid=US:en",
    language: "en",
    international: true,
  },
  {
    name: "Bloomberg Commodities",
    type: SourceType.GOOGLE_NEWS_RSS,
    url: "https://news.google.com/rss/search?q=bloomberg+commodities&hl=en-US&gl=US&ceid=US:en",
    language: "en",
    international: true,
  },
];

async function main() {
  console.log("Seeding Lorinvest Intelligence...");

  for (const [index, s] of sectors.entries()) {
    const sector = await prisma.sector.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        order: index,
      },
      create: {
        slug: s.slug,
        name: s.name,
        description: s.description,
        order: index,
      },
    });

    for (const [tIndex, t] of s.themes.entries()) {
      const theme = await prisma.theme.upsert({
        where: { sectorId_slug: { sectorId: sector.id, slug: t.slug } },
        update: {
          name: t.name,
          kind: t.kind,
          description: t.description,
          order: tIndex,
        },
        create: {
          sectorId: sector.id,
          slug: t.slug,
          name: t.name,
          kind: t.kind,
          description: t.description,
          order: tIndex,
        },
      });

      for (const term of t.keywords ?? []) {
        await prisma.keyword.upsert({
          where: { themeId_term: { themeId: theme.id, term } },
          update: {},
          create: { themeId: theme.id, term },
        });
      }
    }
    console.log(`  setor ${s.name} ok (${s.themes.length} temas)`);
  }

  for (const src of sources) {
    await prisma.source.upsert({
      where: { url: src.url },
      update: {
        name: src.name,
        type: src.type,
        language: src.language,
        international: src.international,
      },
      create: src,
    });
  }
  console.log(`  ${sources.length} fontes cadastradas`);

  await prisma.user.upsert({
    where: { email: "admin@lorinvest.com.br" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@lorinvest.com.br",
      name: "Administrador Lorinvest",
      role: "ADMIN",
    },
  });

  console.log("Seed concluido.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
