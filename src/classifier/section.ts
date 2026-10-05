import type { Market, M3uEntry } from "../types.js";
import type { Category } from "./category.js";

export function sectionFor(entry: M3uEntry, market: Market, category: Category): string {
  const text = `${entry.groupTitle ?? ""} ${entry.name}`;

  if (market === "UK") {
    if (/sky sports|tnt sports|premier sports/i.test(text)) return "UK SPORTS - SKY/TNT/PREMIER";
    if (category === "football") return "UK SPORTS - FOOTBALL";
    if (category === "racing") return "UK SPORTS - RACING";
    if (category === "sports" && /event|ppv|live/i.test(text)) return "UK SPORTS - LIVE EVENTS";
    if (category === "sports") return "UK SPORTS - OTHER";
    if (category === "entertainment") return "UK ENTERTAINMENT";
    if (category === "movies") return "UK MOVIES";
    if (category === "news") return "UK NEWS";
    if (category === "documentary") return "UK DOCUMENTARY";
    if (category === "kids") return "UK KIDS";
    if (category === "music") return "UK MUSIC";
    if (category === "regional") return "UK REGIONAL / LOCAL";
    return "UK OTHER";
  }

  if (market === "US") {
    if (category === "nfl") return "US - NFL";
    if (category === "sports") return "US SPORTS";
    if (category === "movies") return "US MOVIES";
    if (category === "entertainment") return "US ENTERTAINMENT";
    if (category === "news") return "US NEWS";
    if (category === "kids") return "US KIDS";
    if (category === "documentary") return "US DOCUMENTARY";
    if (/network|local|abc|cbs|nbc|fox/i.test(text)) return "US NETWORKS / LOCAL";
    return "US OTHER";
  }

  const labels: Record<Market, string> = {
    UK: "UK",
    US: "US",
    CA: "CANADA",
    IE: "IRELAND",
    AU: "AUSTRALIA",
    NZ: "NEW ZEALAND"
  };

  return `${labels[market]} ${category.toUpperCase()}`;
}
