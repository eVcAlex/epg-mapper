import type { EpgChannel, MatchResult, M3uEntry } from "../types.js";
import { normalizeChannelName } from "../normalizer/channel-name.js";

function aliasTarget(entry: M3uEntry, aliases: Record<string, string>): string | undefined {
  const keys = [entry.tvgId, entry.tvgName, entry.name]
    .filter((value): value is string => Boolean(value));

  for (const key of keys) {
    const target = aliases[key] ?? aliases[normalizeChannelName(key)];
    if (target) return target;
  }
  return undefined;
}

export function matchEpg(
  entry: M3uEntry,
  channels: EpgChannel[],
  aliases: Record<string, string> = {}
): MatchResult {
  if (entry.tvgId && channels.some((channel) => channel.id === entry.tvgId)) {
    return { epgId: entry.tvgId, score: 1, method: "exact-id" };
  }

  const alias = aliasTarget(entry, aliases);
  if (alias && channels.some((channel) => channel.id === alias)) {
    return { epgId: alias, score: 0.99, method: "alias" };
  }

  const targetNames = [entry.name, entry.tvgName]
    .filter((value): value is string => Boolean(value))
    .map(normalizeChannelName)
    .filter(Boolean);

  for (const channel of channels) {
    const normalizedNames = channel.displayNames.map(normalizeChannelName);
    if (targetNames.some((target) => normalizedNames.includes(target))) {
      return { epgId: channel.id, score: 0.95, method: "exact-name" };
    }
  }

  return { score: 0, method: "none" };
}
