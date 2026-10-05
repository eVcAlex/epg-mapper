import type { Category } from "../classifier/category.js";
import type { Market, M3uEntry } from "../types.js";

const MARKET_RANK: Record<Market, number> = {
  UK: 0,
  US: 1,
  CA: 2,
  IE: 3,
  AU: 4,
  NZ: 5
};

const CATEGORY_RANK: Record<Category, number> = {
  sports: 0,
  football: 1,
  racing: 2,
  nfl: 3,
  entertainment: 4,
  movies: 5,
  news: 6,
  documentary: 7,
  kids: 8,
  music: 9,
  regional: 10,
  other: 99
};

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "en", { sensitivity: "base", numeric: true });
}

export function orderPlaylist(
  entries: Array<M3uEntry & { category?: Category }>
): Array<M3uEntry & { category?: Category }> {
  return [...entries].sort((a, b) => {
    const marketA = a.market ? MARKET_RANK[a.market] : 99;
    const marketB = b.market ? MARKET_RANK[b.market] : 99;
    if (marketA !== marketB) return marketA - marketB;

    const catA = a.category ? CATEGORY_RANK[a.category] : 99;
    const catB = b.category ? CATEGORY_RANK[b.category] : 99;
    if (catA !== catB) return catA - catB;

    const groupA = a.groupTitle ?? "";
    const groupB = b.groupTitle ?? "";
    const groupCompare = compareText(groupA, groupB);
    if (groupCompare !== 0) return groupCompare;

    return compareText(a.name, b.name);
  });
}
