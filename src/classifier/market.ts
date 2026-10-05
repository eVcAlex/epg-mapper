import type { Market, M3uEntry } from "../types.js";

const GROUP_MARKERS: Array<{ market: Market; patterns: RegExp[] }> = [
  { market: "UK", patterns: [/\bUK\b/i, /UNITED KINGDOM/i, /BRITISH/i] },
  { market: "US", patterns: [/\bUSA\b/i, /\bUS\b/i, /UNITED STATES/i] },
  { market: "CA", patterns: [/\bCANADA\b/i, /\bCANADIAN\b/i] },
  { market: "IE", patterns: [/\bIRELAND\b/i, /\bIRISH\b/i] },
  { market: "AU", patterns: [/\bAUSTRALIA\b/i, /\bAUSTRALIAN\b/i] },
  { market: "NZ", patterns: [/\bNEW ZEALAND\b/i] }
];

const NAME_HINTS: Array<{ market: Market; patterns: RegExp[] }> = [
  { market: "UK", patterns: [/^UK\s*[|:-]/i, /\b(?:BBC|ITV|STV|S4C|UTV)\b/i] },
  { market: "US", patterns: [/^US(?:A)?\s*[|:-]/i] },
  { market: "CA", patterns: [/^CA\s*[|:-]/i] },
  { market: "IE", patterns: [/^IE\s*[|:-]/i, /\bRT[ÉE]\b/i, /\bTG4\b/i] },
  { market: "AU", patterns: [/^AU\s*[|:-]/i] },
  { market: "NZ", patterns: [/^NZ\s*[|:-]/i] }
];

export function classifyMarket(entry: M3uEntry): Market | undefined {
  const group = entry.groupTitle ?? "";
  for (const rule of GROUP_MARKERS) {
    if (rule.patterns.some((pattern) => pattern.test(group))) return rule.market;
  }

  const name = entry.name;
  for (const rule of NAME_HINTS) {
    if (rule.patterns.some((pattern) => pattern.test(name))) return rule.market;
  }

  return undefined;
}
