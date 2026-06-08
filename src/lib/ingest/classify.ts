import { Keyword, Theme, ThemeKind } from "@prisma/client";

export type ThemeWithKeywords = Theme & { keywords: Keyword[] };

export type ClassificationMatch = {
  themeId: string;
  themeKind: ThemeKind;
  matchedTerms: string[];
  score: number;
  // True quando algum termo casou no titulo (relevante para auto-importante)
  inTitle: boolean;
};

const STRIP = /[\p{P}\p{S}]/gu;

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(STRIP, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenContains(haystack: string, needle: string) {
  const n = normalize(needle);
  if (!n) return false;
  // Casamento por palavra inteira (boundary)
  const re = new RegExp(`(^|\\s)${escapeRegex(n)}(\\s|$)`, "i");
  return re.test(haystack);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordMatches(
  kw: Keyword,
  normTitle: string,
  normBody: string,
): { matched: boolean; inTitle: boolean } {
  const corpus = kw.titleOnly ? normTitle : `${normTitle} ${normBody}`;
  if (!tokenContains(corpus, kw.term)) return { matched: false, inTitle: false };

  for (const req of kw.requireAll) {
    if (!tokenContains(corpus, req)) return { matched: false, inTitle: false };
  }
  for (const excl of kw.excludeAny) {
    if (tokenContains(corpus, excl)) return { matched: false, inTitle: false };
  }
  const inTitle = tokenContains(normTitle, kw.term);
  return { matched: true, inTitle };
}

export type ClassifyInput = {
  title: string;
  body: string;
  isInternationalSource: boolean;
};

/**
 * Aplica as regras de classificacao da spec.
 *
 * Regra 1: keyword da coluna PORTFOLIO -> noticia aparece SO em PORTFOLIO.
 * Regra 2: keyword da coluna CONCORRENTES -> noticia aparece SO em CONCORRENTES.
 * Regra 3: outras colunas podem duplicar.
 * Regra 4: IMPORTANTE nunca recebe noticias diretamente por keyword.
 *          Eh marcada via campo `important`/`importantAuto` no item.
 * Regra 5: termo no titulo -> marcar automaticamente como importante.
 * INTERNACIONAL: alimentada por fontes marcadas como internacionais.
 */
export function classify(
  input: ClassifyInput,
  themes: ThemeWithKeywords[],
): {
  matches: ClassificationMatch[];
  matchedTermsAll: string[];
  importantAuto: boolean;
} {
  const normTitle = normalize(input.title);
  const normBody = normalize(input.body);

  const portfolio: ClassificationMatch[] = [];
  const competitor: ClassificationMatch[] = [];
  const standard: ClassificationMatch[] = [];
  const matchedTermsAll = new Set<string>();
  let importantAuto = false;

  for (const theme of themes) {
    if (
      theme.kind === ThemeKind.IMPORTANT ||
      theme.kind === ThemeKind.INTERNATIONAL
    ) {
      continue;
    }
    const matchedTerms: string[] = [];
    let inTitle = false;
    for (const kw of theme.keywords) {
      if (!kw.active) continue;
      const r = keywordMatches(kw, normTitle, normBody);
      if (r.matched) {
        matchedTerms.push(kw.term);
        if (r.inTitle) {
          inTitle = true;
          importantAuto = true;
        }
      }
    }
    if (matchedTerms.length === 0) continue;
    matchedTerms.forEach((t) => matchedTermsAll.add(t));
    const match: ClassificationMatch = {
      themeId: theme.id,
      themeKind: theme.kind,
      matchedTerms,
      score: matchedTerms.length * 10 + (inTitle ? 20 : 0),
      inTitle,
    };
    if (theme.kind === ThemeKind.PORTFOLIO) portfolio.push(match);
    else if (theme.kind === ThemeKind.COMPETITOR) competitor.push(match);
    else standard.push(match);
  }

  // Regras 1 e 2: exclusividade
  let finalMatches: ClassificationMatch[];
  if (portfolio.length) finalMatches = portfolio;
  else if (competitor.length) finalMatches = competitor;
  else finalMatches = standard;

  // INTERNACIONAL: anexa o tema correspondente quando a fonte e internacional.
  if (input.isInternationalSource) {
    const intl = themes.find((t) => t.kind === ThemeKind.INTERNATIONAL);
    if (intl) {
      finalMatches.push({
        themeId: intl.id,
        themeKind: ThemeKind.INTERNATIONAL,
        matchedTerms: [],
        score: 5,
        inTitle: false,
      });
    }
  }

  // IMPORTANTE: se importantAuto, anexa o tema IMPORTANTE como duplicacao.
  if (importantAuto) {
    const imp = themes.find((t) => t.kind === ThemeKind.IMPORTANT);
    if (imp) {
      finalMatches.push({
        themeId: imp.id,
        themeKind: ThemeKind.IMPORTANT,
        matchedTerms: Array.from(matchedTermsAll),
        score: 50,
        inTitle: true,
      });
    }
  }

  return {
    matches: finalMatches,
    matchedTermsAll: Array.from(matchedTermsAll),
    importantAuto,
  };
}
