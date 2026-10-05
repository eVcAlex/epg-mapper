import type { M3uEntry } from "../types.js";

const ATTR_RE = /([\\w-]+)="([^"]*)"/g;

export function parseExtinf(line: string): M3uEntry {
  const attrs: Record<string, string> = {};
  for (const match of line.matchAll(ATTR_RE)) {
    const key = match[1];
    const value = match[2];
    if (key && value !== undefined) attrs[key] = value;
  }

  const name = line.includes(",") ? line.split(",", 2)[1]!.trim() : (attrs["tvg-name"] ?? "");

  return {
    extinf: line,
    name,
    groupTitle: attrs["group-title"],
    tvgId: attrs["tvg-id"],
    tvgName: attrs["tvg-name"],
    tvgLogo: attrs["tvg-logo"],
    url: ""
  };
}

export function updateTvgId(extinf: string, epgId: string): string {
  if (/tvg-id="/i.test(extinf)) {
    return extinf.replace(/tvg-id="[^"]*"/i, `tvg-id="${epgId}"`);
  }
  return extinf.replace(/(#EXTINF:[^ ]+)/, `$1 tvg-id="${epgId}"`);
}
