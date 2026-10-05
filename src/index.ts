import { readFile } from "node:fs/promises";

const args = new Set(process.argv.slice(2));
const input = process.argv.find((arg) => !arg.startsWith("--"));

if (!input) {
  console.error("Usage: npm start -- <m3u-file>");
  process.exit(1);
}

const data = await readFile(input, "utf8");
console.log(`Loaded ${data.length.toLocaleString()} characters from ${input}`);
console.log(args.has("--dry-run") ? "Dry run." : "Parser bootstrap only; mapper pipeline comes next.");
