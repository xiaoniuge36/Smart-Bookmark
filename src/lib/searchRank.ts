export interface SearchRankInput {
  id: string;
  title: string;
  url: string;
  path?: string;
  boost?: number;
}

export interface SearchRanked<T extends SearchRankInput> {
  item: T;
  score: number;
}

export function rankSearchItems<T extends SearchRankInput>(
  query: string,
  items: T[],
  limit = 12,
): Array<SearchRanked<T>> {
  const q = normalizeText(query);
  if (!q) return [];

  const seen = new Set<string>();
  return items
    .map((item) => ({ item, score: scoreSearchItem(q, item) }))
    .filter((x) => x.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title),
    )
    .filter(({ item }) => {
      const key = normalizeUrlKey(item.url);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

export function scoreSearchItem(
  normalizedQuery: string,
  item: SearchRankInput,
): number {
  const title = normalizeText(item.title);
  const host = normalizeText(hostnameOf(item.url));
  const url = normalizeText(item.url);
  const path = normalizeText(item.path ?? "");
  const boost = item.boost ?? 0;

  let score = 0;
  score = Math.max(score, scoreText(normalizedQuery, title, 120));
  score = Math.max(score, scoreText(normalizedQuery, host, 92));
  score = Math.max(score, scoreText(normalizedQuery, url, 72));
  score = Math.max(score, scoreText(normalizedQuery, path, 48));
  return score ? score + boost : 0;
}

export function scoreText(
  normalizedQuery: string,
  normalizedText: string,
  base: number,
): number {
  if (!normalizedQuery || !normalizedText) return 0;
  if (normalizedText === normalizedQuery) return base + 80;
  if (normalizedText.startsWith(normalizedQuery)) return base + 55;
  const index = normalizedText.indexOf(normalizedQuery);
  if (index >= 0) return base + 35 - Math.min(index, 24);

  const fuzzy = fuzzySpan(normalizedQuery, normalizedText);
  if (!fuzzy) return 0;
  const density = normalizedQuery.length / fuzzy.span;
  return Math.round(base * 0.42 + density * 30);
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function fuzzySpan(query: string, text: string): { span: number } | null {
  let qi = 0;
  let start = -1;
  let end = -1;
  for (let i = 0; i < text.length && qi < query.length; i++) {
    if (text[i] !== query[qi]) continue;
    if (start < 0) start = i;
    end = i;
    qi++;
  }
  if (qi !== query.length || start < 0 || end < 0) return null;
  return { span: end - start + 1 };
}

function normalizeUrlKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString().toLowerCase();
  } catch {
    return normalizeText(url);
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
