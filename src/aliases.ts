import { readFile } from "node:fs/promises";
import type { Market } from "./types.js";

const FILES: Record<Market, string> = {
  UK: "mappings/uk.json",
  US: "mappings/us.json",
  CA: "mappings/canada.json",
  IE: "mappings/ireland.json",
  AU: "mappings/australia.json",
  NZ: "mappings/new-zealand.json"
};

export async function loadAliases(markets: Market[]): Promise<Record<string, string>> {
  const merged: Record<string, string> = {};

  for (const market of markets) {
    try {
      const raw = await readFile(FILES[market], "utf8");
      const parsed = JSON.parse(raw) as { aliases?: Record<string, string> };
      Object.assign(merged, parsed.aliases ?? {});
    } catch {
      // Missing mapping files are allowed during development.
    }
  }

  return merged;
}
