import type { M3uEntry } from "../types.js";

const ATTR_RE = /([\w-]+)="([^"]*)"/g;

export function parseExtinf(line: string): M3uEntry {
  const attrs: Record<string, string> = {};
  for (const match of line.matchAll(ATTR_RE)) {
    const key = match[1];
    const value = match[2];
    if (key && value !== undefined) attrs[key] = value;
  }

  const comma = line.indexOf(",");
  const name = comma >= 0
    ? line.slice(comma + 1).trim()
    : (attrs["tvg-name"] ?? "");

  const entry: M3uEntry = {
    extinf: line,
    name,
    url: ""
  };

  if (attrs["group-title"] !== undefined) entry.groupTitle = attrs["group-title"];
  if (attrs["tvg-id"] !== undefined) entry.tvgId = attrs["tvg-id"];
  if (attrs["tvg-name"] !== undefined) entry.tvgName = attrs["tvg-name"];
  if (attrs["tvg-logo"] !== undefined) entry.tvgLogo = attrs["tvg-logo"];

  return entry;
}

export function updateTvgId(extinf: string, epgId: string): string {
  if (/tvg-id="/i.test(extinf)) {
    return extinf.replace(/tvg-id="[^"]*"/i, `tvg-id="${epgId}"`);
  }
  return extinf.replace(/(#EXTINF:[^ ]+)/, `$1 tvg-id="${epgId}"`);
}
