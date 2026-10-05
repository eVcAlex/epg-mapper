import { createWriteStream, promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import type { Market, M3uEntry, MatchResult, MappingStats } from "./types.js";
import { openSource } from "./io/source.js";
import { parseM3uStream } from "./parser/m3u-stream.js";
import { readEpgChannels } from "./parser/xmltv-stream.js";
import { EpgIndex } from "./matcher/epg-index.js";
import { classifyMarket } from "./classifier/market.js";
import { classifyCategory, isExcludedVod } from "./classifier/category.js";
import { sectionFor } from "./classifier/section.js";
import { renderM3uEntry } from "./generator/m3u.js";
import { loadAliases } from "./aliases.js";

const MARKETS: Market[] = ["UK", "US", "CA", "IE", "AU", "NZ"];

const SECTION_ORDER = [
  "UK SPORTS - SKY/TNT/PREMIER",
  "UK SPORTS - FOOTBALL",
  "UK SPORTS - RACING",
  "UK SPORTS - LIVE EVENTS",
  "UK SPORTS - OTHER",
  "UK ENTERTAINMENT",
  "UK MOVIES",
  "UK NEWS",
  "UK DOCUMENTARY",
  "UK KIDS",
  "UK MUSIC",
  "UK REGIONAL / LOCAL",
  "UK OTHER",
  "US - NFL",
  "US SPORTS",
  "US MOVIES",
  "US ENTERTAINMENT",
  "US NEWS",
  "US KIDS",
  "US DOCUMENTARY",
  "US NETWORKS / LOCAL",
  "US OTHER",
  "IRELAND SPORTS",
  "IRELAND FOOTBALL",
  "IRELAND RACING",
  "IRELAND ENTERTAINMENT",
  "IRELAND NEWS",
  "IRELAND OTHER",
  "CANADA SPORTS",
  "CANADA FOOTBALL",
  "CANADA RACING",
  "CANADA ENTERTAINMENT",
  "CANADA NEWS",
  "CANADA DOCUMENTARY",
  "CANADA KIDS",
  "CANADA MUSIC",
  "CANADA REGIONAL",
  "CANADA OTHER",
  "AUSTRALIA SPORTS",
  "AUSTRALIA FOOTBALL",
  "AUSTRALIA RACING",
  "AUSTRALIA ENTERTAINMENT",
  "AUSTRALIA NEWS",
  "AUSTRALIA DOCUMENTARY",
  "AUSTRALIA KIDS",
  "AUSTRALIA MUSIC",
  "AUSTRALIA OTHER",
  "NEW ZEALAND SPORTS",
  "NEW ZEALAND FOOTBALL",
  "NEW ZEALAND RACING",
  "NEW ZEALAND ENTERTAINMENT",
  "NEW ZEALAND NEWS",
  "NEW ZEALAND DOCUMENTARY",
  "NEW ZEALAND KIDS",
  "NEW ZEALAND MUSIC",
  "NEW ZEALAND OTHER"
];

const ORDER_RANK = new Map(SECTION_ORDER.map((section, index) => [section, index]));

function emptyStats(): MappingStats {
  return {
    totalInput: 0,
    retained: 0,
    byMarket: { UK: 0, US: 0, CA: 0, IE: 0, AU: 0, NZ: 0 },
    matched: { "exact-id": 0, "exact-name": 0, alias: 0, fuzzy: 0, none: 0 },
    sections: {}
  };
}

function increment<T extends string>(record: Record<T, number>, key: T): void {
  record[key] = (record[key] ?? 0) + 1;
}

async function writeWithBackpressure(
  writer: ReturnType<typeof createWriteStream>,
  text: string
): Promise<void> {
  if (writer.write(text)) return;
  await new Promise<void>((resolve, reject) => {
    const onDrain = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      writer.off("drain", onDrain);
      writer.off("error", onError);
    };
    writer.once("drain", onDrain);
    writer.once("error", onError);
  });
}

export interface PipelineResult {
  outputPath: string;
  stats: MappingStats;
  matchedEpgIds: Set<string>;
}

export async function runPipeline(
  m3uSource: string,
  epgSource: string,
  outputPath: string
): Promise<PipelineResult> {
  const stats = emptyStats();
  const aliases = await loadAliases(MARKETS);
  const epgChannels = await readEpgChannels(await openSource(epgSource));
  const index = new EpgIndex(epgChannels);
  const matchCache = new Map<string, MatchResult>();
  const matchedEpgIds = new Set<string>();

  const tempDir = await fs.mkdtemp(join(process.cwd(), ".epg-mapper-"));
  const writers = new Map<string, ReturnType<typeof createWriteStream>>();

  const getWriter = (section: string) => {
    const safeName = section.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    let writer = writers.get(section);
    if (!writer) {
      writer = createWriteStream(join(tempDir, safeName + ".m3u.part"), { encoding: "utf8" });
      writers.set(section, writer);
    }
    return writer;
  };

  try {
    for await (const entry of parseM3uStream(await openSource(m3uSource))) {
      stats.totalInput++;

      // MegaOTT contains large VOD/series sections; the curated list is live TV first.
      if (isExcludedVod(entry)) continue;

      const market = classifyMarket(entry);
      if (!market) continue;

      const category = classifyCategory(entry, market);
      const section = sectionFor(entry, market, category);
      const cacheKey = `${market}|${entry.tvgId ?? ""}|${entry.tvgName ?? ""}|${entry.name}`;
      let match = matchCache.get(cacheKey);
      if (!match) {
        match = index.match(entry, aliases);
        matchCache.set(cacheKey, match);
      }

      if (match.epgId) matchedEpgIds.add(match.epgId);

      const enriched: M3uEntry = { ...entry, market };
      await writeWithBackpressure(
        getWriter(section),
        renderM3uEntry(enriched, section, match.epgId)
      );

      stats.retained++;
      stats.byMarket[market]++;
      increment(stats.matched, match.method);
      increment(stats.sections, section);
    }

    for (const writer of writers.values()) {
      await new Promise<void>((resolve, reject) => {
        const onFinish = () => {
          cleanup();
          resolve();
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          writer.off("finish", onFinish);
          writer.off("error", onError);
        };
        writer.once("finish", onFinish);
        writer.once("error", onError);
        writer.end();
      });
    }

    await fs.mkdir(dirname(outputPath), { recursive: true });
    const finalWriter = createWriteStream(outputPath, { encoding: "utf8" });

    await writeWithBackpressure(finalWriter, "#EXTM3U\n");

    const sections = [...writers.keys()].sort(
      (a, b) => (ORDER_RANK.get(a) ?? 999) - (ORDER_RANK.get(b) ?? 999)
    );

    for (const section of sections) {
      const safeName = section.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const part = join(tempDir, safeName + ".m3u.part");
      await writeWithBackpressure(finalWriter, await fs.readFile(part, "utf8"));
    }

    await new Promise<void>((resolve, reject) => {
      const onFinish = () => {
        cleanup();
        resolve();
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        finalWriter.off("finish", onFinish);
        finalWriter.off("error", onError);
      };
      finalWriter.once("finish", onFinish);
      finalWriter.once("error", onError);
      finalWriter.end();
    });

    return { outputPath, stats, matchedEpgIds };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}
