import type { EpgChannel, M3uEntry, MatchResult, Market } from "../types.js";
import { normalizeChannelName } from "../normalizer/channel-name.js";

function similarity(a: string, b: string): number {
  if (a === b) return 1;

  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection++;
  }

  return (2 * intersection) / (aTokens.size + bTokens.size);
}

function countryBias(id: string, market: Market): number {
  const lower = id.toLowerCase();

  const matchingSuffixes: Record<Market, RegExp> = {
    UK: /(?:^|[.-])uk(?:[.-]|$)/i,
    US: /(?:^|[.-])us(?:[.-]|$)/i,
    CA: /(?:^|[.-])ca(?:[.-]|$)/i,
    IE: /(?:^|[.-])ie(?:[.-]|$)/i,
    AU: /(?:^|[.-])au(?:[.-]|$)/i,
    NZ: /(?:^|[.-])nz(?:[.-]|$)|newzealand/i
  };

  const conflictingSuffixes = Object.entries(matchingSuffixes)
    .filter(([otherMarket]) => otherMarket !== market)
    .map(([, pattern]) => pattern);

  if (matchingSuffixes[market].test(lower)) return 3;
  if (conflictingSuffixes.some((pattern) => pattern.test(lower))) return -5;
  return 0;
}

export class EpgIndex {
  private readonly byId = new Map<string, EpgChannel>();
  private readonly byName = new Map<string, string[]>();
  private readonly byFirstToken = new Map<string, string[]>();

  constructor(channels: EpgChannel[]) {
    for (const channel of channels) {
      this.byId.set(channel.id, channel);

      for (const displayName of channel.displayNames) {
        const key = normalizeChannelName(displayName);
        if (!key) continue;

        const ids = this.byName.get(key) ?? [];
        if (!ids.includes(channel.id)) ids.push(channel.id);
        this.byName.set(key, ids);

        const firstToken = key.split(" ")[0];
        if (firstToken) {
          const candidates = this.byFirstToken.get(firstToken) ?? [];
          if (!candidates.includes(channel.id)) candidates.push(channel.id);
          this.byFirstToken.set(firstToken, candidates);
        }
      }
    }
  }

  match(
    entry: M3uEntry,
    market: Market,
    aliases: Record<string, string> = {}
  ): MatchResult {
    if (entry.tvgId && this.byId.has(entry.tvgId) && countryBias(entry.tvgId, market) >= 0) {
      return { epgId: entry.tvgId, score: 1, method: "exact-id" };
    }

    const names = [entry.tvgName, entry.name]
      .filter((value): value is string => Boolean(value))
      .map(normalizeChannelName)
      .filter(Boolean);

    for (const key of [entry.tvgId, ...names]) {
      if (!key) continue;
      const alias = aliases[key] ?? aliases[normalizeChannelName(key)];
      if (alias && this.byId.has(alias) && countryBias(alias, market) >= 0) {
        return { epgId: alias, score: 0.99, method: "alias" };
      }
    }

    for (const key of names) {
      const candidates = this.byName.get(key) ?? [];
      let bestId: string | undefined;
      let bestBias = -Infinity;

      for (const id of candidates) {
        const bias = countryBias(id, market);
        if (bias > bestBias) {
          bestBias = bias;
          bestId = id;
        }
      }

      if (bestId && bestBias >= 0) {
        return { epgId: bestId, score: bestBias > 0 ? 0.97 : 0.95, method: "exact-name" };
      }
    }

    for (const key of names) {
      const firstToken = key.split(" ")[0];
      if (!firstToken) continue;

      let bestId: string | undefined;
      let bestScore = 0;

      for (const id of this.byFirstToken.get(firstToken) ?? []) {
        const bias = countryBias(id, market);
        if (bias < 0) continue;

        const channel = this.byId.get(id);
        if (!channel) continue;

        for (const displayName of channel.displayNames) {
          let score = similarity(key, normalizeChannelName(displayName));
          if (bias > 0) score += 0.02;
          if (score > bestScore) {
            bestScore = score;
            bestId = id;
          }
        }
      }

      if (bestId && bestScore >= 0.9) {
        return { epgId: bestId, score: Math.min(bestScore, 0.99), method: "fuzzy" };
      }
    }

    return { score: 0, method: "none" };
  }
}
