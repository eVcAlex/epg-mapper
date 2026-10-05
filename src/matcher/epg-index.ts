import type { EpgChannel, M3uEntry, MatchResult } from "../types.js";
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

  match(entry: M3uEntry, aliases: Record<string, string> = {}): MatchResult {
    if (entry.tvgId && this.byId.has(entry.tvgId)) {
      return { epgId: entry.tvgId, score: 1, method: "exact-id" };
    }

    const names = [entry.tvgName, entry.name]
      .filter((value): value is string => Boolean(value))
      .map(normalizeChannelName)
      .filter(Boolean);

    for (const key of [entry.tvgId, ...names]) {
      if (!key) continue;
      const alias = aliases[key] ?? aliases[normalizeChannelName(key)];
      if (alias && this.byId.has(alias)) {
        return { epgId: alias, score: 0.99, method: "alias" };
      }
    }

    for (const key of names) {
      const ids = this.byName.get(key);
      if (ids?.[0]) return { epgId: ids[0], score: 0.95, method: "exact-name" };
    }

    for (const key of names) {
      const firstToken = key.split(" ")[0];
      if (!firstToken) continue;

      let bestId: string | undefined;
      let bestScore = 0;

      for (const id of this.byFirstToken.get(firstToken) ?? []) {
        const channel = this.byId.get(id);
        if (!channel) continue;

        for (const displayName of channel.displayNames) {
          const score = similarity(key, normalizeChannelName(displayName));
          if (score > bestScore) {
            bestScore = score;
            bestId = id;
          }
        }
      }

      if (bestId && bestScore >= 0.9) {
        return { epgId: bestId, score: bestScore, method: "fuzzy" };
      }
    }

    return { score: 0, method: "none" };
  }
}
