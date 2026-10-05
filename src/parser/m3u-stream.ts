import { createInterface } from "node:readline";
import type { Readable } from "node:stream";
import type { M3uEntry } from "../types.js";
import { parseExtinf } from "./m3u.js";

export async function* parseM3uStream(
  source: Readable
): AsyncGenerator<M3uEntry, void, void> {
  const lines = createInterface({
    input: source,
    crlfDelay: Infinity
  });

  let pending: M3uEntry | undefined;

  for await (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF:")) {
      pending = parseExtinf(line);
      continue;
    }

    if (pending && !line.startsWith("#")) {
      yield { ...pending, url: line };
      pending = undefined;
    }
  }
}
