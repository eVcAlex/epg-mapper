import type { Market, M3uEntry } from "../types.js";

export type Category =
  | "sports"
  | "football"
  | "racing"
  | "nfl"
  | "entertainment"
  | "movies"
  | "news"
  | "documentary"
  | "kids"
  | "music"
  | "regional"
  | "other";

const EXCLUDED_VOD = /\b(?:VOD|ON[- ]?DEMAND|SERIES)\b/i;

export function isExcludedVod(entry: M3uEntry): boolean {
  const text = `${entry.groupTitle ?? ""} ${entry.name}`;
  return EXCLUDED_VOD.test(text);
}

export function classifyCategory(entry: M3uEntry, market?: Market): Category {
  const text = `${entry.groupTitle ?? ""} ${entry.name}`.toLowerCase();

  if (market === "US" && /\bnfl\b|nfl network|redzone|red zone/.test(text)) return "nfl";
  if (/racing|horse racing|at the races|racing tv|sky sports racing|f1\b/.test(text)) return "racing";
  if (/football|soccer|premier league|champions league|europa league|league one|league two|epl\b|efl\b|spfl\b/.test(text)) return "football";
  if (/sport|sky sports|tnt sports|premier sports|espn|bein sport|motor sport|golf|tennis|cricket|rugby|nba|nhl|mlb|nfl/.test(text)) return "sports";
  if (/movie|cinema|film|sky cinema|hbo|showtime/.test(text)) return "movies";
  if (/news|bbc news|sky news|cnn|msnbc|fox news|gb news/.test(text)) return "news";
  if (/documentary|history|nat geo|national geographic|discovery|animal planet/.test(text)) return "documentary";
  if (/kids|children|cbeebies|cbkids|nick|cartoon|disney junior/.test(text)) return "kids";
  if (/music|mtv|vh1|vevo/.test(text)) return "music";
  if (/regional|region|local|scotland|wales|northern ireland|yorkshire|midlands|london/.test(text)) return "regional";
  if (/entertainment|drama|comedy|reality|lifestyle|food|travel|channel 4|itv|bbc one|bbc two/.test(text)) return "entertainment";
  return "other";
}
