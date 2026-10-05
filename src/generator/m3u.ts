import type { M3uEntry } from "../types.js";

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function setAttribute(line: string, key: string, value: string): string {
  const escaped = escapeAttribute(value);
  const re = new RegExp(`\\b${key}="[^"]*"`, "i");
  if (re.test(line)) return line.replace(re, `${key}="${escaped}"`);
  return line.replace(/^#EXTINF:-?\d+/i, (prefix) => `${prefix} ${key}="${escaped}"`);
}

function cleanDisplayName(name: string): string {
  return name
    .replace(/^(?:UK|US|USA|CA|IE|AU|NZ)\s*[|:-]\s*/i, "")
    .replace(/^\s*[✦●]+\s*/u, "")
    .replace(/\s*[✦●]+\s*$/u, "")
    .trim();
}

export function renderM3uEntry(entry: M3uEntry, section: string, epgId?: string): string {
  let line = entry.extinf;
  line = setAttribute(line, "group-title", section);
  if (epgId) line = setAttribute(line, "tvg-id", epgId);

  const comma = line.indexOf(",");
  if (comma >= 0) {
    line = `${line.slice(0, comma + 1)}${cleanDisplayName(entry.name)}`;
  }

  return `${line}\n${entry.url}\n`;
}
