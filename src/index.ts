import { writeFile } from "node:fs/promises";
import { runPipeline } from "./pipeline.js";

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const m3uSource = getArg("--m3u") ?? process.env.M3U_SOURCE_URL;
const epgSource = getArg("--epg") ?? process.env.EPG_SOURCE_URL;
const output = getArg("--output") ?? process.env.OUTPUT_M3U ?? "output/megaott.m3u";
const report = getArg("--report") ?? process.env.OUTPUT_REPORT ?? "output/report.json";

if (!m3uSource || !epgSource) {
  console.error(
    "Usage: npm run map -- --m3u <file-or-url> --epg <file-or-url> " +
    "[--output output/megaott.m3u] [--report output/report.json]"
  );
  process.exit(2);
}

console.error("Indexing XMLTV channels...");
const result = await runPipeline(m3uSource, epgSource, output);

await writeFile(report, JSON.stringify({
  generatedAt: new Date().toISOString(),
  output: result.outputPath,
  stats: result.stats,
  matchedEpgIds: result.matchedEpgIds.size
}, null, 2) + "\n");

console.log(JSON.stringify({
  output: result.outputPath,
  report,
  stats: result.stats,
  matchedEpgIds: result.matchedEpgIds.size
}, null, 2));
