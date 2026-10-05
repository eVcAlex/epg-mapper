const PROVIDER_PREFIX = /^\s*(EU|AM|OC|NA|CA|UK|US)\s*[|:-]\s*/i;

export function normalizeChannelName(value: string): string {
  let name = value.replace(PROVIDER_PREFIX, "");
  name = name.toUpperCase().replace(/&/g, " AND ");
  name = name.replace(/\b(FHD|UHD|HD|SD)\b/g, " ");
  name = name.replace(/\bPLUS\s*1\b|\+\s*1\b/g, " PLUS1 ");
  name = name.replace(/[^A-Z0-9+]+/g, " ");
  return name.replace(/\s+/g, " ").trim();
}
