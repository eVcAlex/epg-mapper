const PROVIDER_PREFIX = /^\s*(EU|AM|OC)\s*[|:-]\s*/i;

const BBC_NUMBERS: Record<string, string> = {
  "1": "ONE",
  "2": "TWO",
  "3": "THREE",
  "4": "FOUR"
};

export function normalizeChannelName(value: string): string {
  let name = value.replace(PROVIDER_PREFIX, "");
  name = name.toUpperCase().replace(/&/g, " AND ");

  name = name.replace(/\bBBC\s+([1-4])\b/g, (_, number: string) => `BBC ${BBC_NUMBERS[number] ?? number}`);
  name = name.replace(/\bITV\s+([1-4])\b/g, "ITV$1");

  name = name.replace(/\b(FHD|UHD|HD|SD|HEVC)\b/g, " ");
  name = name.replace(/\bPLUS\s*1\b|\+\s*1\b/g, " PLUS1 ");
  name = name.replace(/\[[A-Z]{1,3}\]/g, " ");
  name = name.replace(/[^A-Z0-9+]+/g, " ");

  return name.replace(/\s+/g, " ").trim();
}
