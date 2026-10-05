export type Market = "UK" | "US" | "CA" | "IE" | "AU" | "NZ";

export interface M3uEntry {
  extinf: string;
  name: string;
  groupTitle?: string;
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  url: string;
  market?: Market;
}

export interface EpgChannel {
  id: string;
  displayNames: string[];
}

export interface MatchResult {
  epgId?: string;
  score: number;
  method: "exact-id" | "exact-name" | "alias" | "fuzzy" | "none";
}

export interface MappingStats {
  totalInput: number;
  retained: number;
  byMarket: Record<Market, number>;
  matched: Record<MatchResult["method"], number>;
  sections: Record<string, number>;
}
