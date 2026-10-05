import type { Market, M3uEntry } from "../types.js";

const RULES: Array<{ market: Market; patterns: RegExp[] }> = [
  { market: "UK", patterns: [/\\buk\\b/i, /united kingdom/i, /british/i, /bbc /i, /itv /i, /channel 4/i, /channel 5/i, /sky /i, /tnt sports/i] },
  { market: "US", patterns: [/\\bus\\b/i, /usa/i, /united states/i, /american/i, /espn/i, /fox /i, /abc /i, /nbc /i, /cbs/i] },
  { market: "CA", patterns: [/\\bcanada\\b/i, /canadian/i, /cbc/i, /ctv/i] },
  { market: "IE", patterns: [/\\bireland\\b/i, /irish/i, /rte/i, /virgin media/i, /tg4/i] },
  { market: "AU", patterns: [/\\baustralia\\b/i, /australian/i, /abc au/i, /sbs/i, /seven network/i, /nine network/i] },
  { market: "NZ", patterns: [/\\bnew zealand\\b/i, /new zealand/i, /tvnz/i, /three nz/i] }
];

export function classifyMarket(entry: M3uEntry): Market | undefined {
  const text = `${entry.groupTitle ?? ""} ${entry.name}`;
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) return rule.market;
  }
  return undefined;
}
