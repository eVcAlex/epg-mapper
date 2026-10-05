import type { EpgChannel, MatchResult, M3uEntry, Market } from "../types.js";
import { EpgIndex } from "./epg-index.js";

export function matchEpg(
  entry: M3uEntry,
  market: Market,
  channels: EpgChannel[],
  aliases: Record<string, string> = {}
): MatchResult {
  return new EpgIndex(channels).match(entry, market, aliases);
}
