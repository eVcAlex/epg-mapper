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

export function classifyCategory(entry: M3uEntry, market?: Market): Category {
  const text = `${entry.groupTitle ?? ""} ${entry.name}`.toLowerCase();

  if (/\\bnfl\\b|nfl network|redzone|red zone|espn/.test(text) && market === "US") return "nfl";
  if (/racing|horse racing|at the races|racing tv|sky sports racing/.test(text)) return "racing";
  if (/football|soccer|premier league|champions league|europa league|league one|league two/.test(text)) return "football";
  if (/sport|sky sports|tnt sports|premier sports|espn|bein sport|motor sport|golf|tennis|cricket|rugby/.test(text)) return "sports";
  if (/movie|cinema|film|sky cinema|hbo|showtime/.test(text)) return "movies";
  if (/news|bbc news|sky news|cnn|msnbc|fox news|gb news/.test(text)) return "news";
  if (/documentary|history|nat geo|national geographic|discovery|animal planet/.test(text)) return "documentary";
  if (/kids|children|cbeebies|cbkids|nick|cartoon|disney junior/.test(text)) return "kids";
  if (/music|mtv|vh1|vevo/.test(text)) return "music";
  if (/region|scotland|wales|northern ireland|north east|yorkshire|midlands|london/.test(text)) return "regional";
  if (/entertainment|drama|comedy|reality|lifestyle|food|travel|channel 4|itv|bbc one|bbc two/.test(text)) return "entertainment";
  return "other";
}
