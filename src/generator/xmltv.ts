import { createWriteStream, promises as fs } from "node:fs";
import { dirname } from "node:path";

function getAttribute(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match?.[1];
}

export async function filterXmltv(
  sourcePathOrUrl: string,
  matchedIds: Set<string>,
  outputPath: string
): Promise<number> {
  const source = await import("../io/source.js").then((m) => m.openSource(sourcePathOrUrl));
  await fs.mkdir(dirname(outputPath), { recursive: true });

  const writer = createWriteStream(outputPath, { encoding: "utf8" });
  let buffer = "";
  let rootWritten = false;
  let writtenPrograms = 0;
  let writtenChannels = 0;

  const processBuffer = async (final: boolean): Promise<void> => {
    const root = buffer.match(/<tv(?:\s[^>]*)?>/i);
    if (!root) {
      if (final && buffer.includes("</tv>")) throw new Error("Invalid XMLTV: missing <tv> root");
      return;
    }

    if (!rootWritten) {
      await write(writer, '<?xml version="1.0" encoding="UTF-8"?>\n');
      await write(writer, root[0] + "\n");
      rootWritten = true;
      buffer = buffer.slice((root.index ?? 0) + root[0].length);
    }

    const blockRe = /<(channel|programme)\b[\s\S]*?<\/\1>/gi;
    let last = 0;
    let match: RegExpExecArray | null;

    while ((match = blockRe.exec(buffer))) {
      const block = match[0];
      const type = match[1]?.toLowerCase();
      const id = type === "channel"
        ? getAttribute(block, "id")
        : getAttribute(block, "channel");

      if (id && matchedIds.has(id)) {
        await write(writer, block + "\n");
        if (type === "channel") writtenChannels++;
        else writtenPrograms++;
      }

      last = blockRe.lastIndex;
    }

    if (last > 0) buffer = buffer.slice(last);

    const endIndex = buffer.indexOf("</tv>");
    if (endIndex >= 0) {
      await write(writer, "</tv>\n");
      buffer = buffer.slice(endIndex + 5);
    } else if (buffer.length > 2_000_000) {
      // Keep enough tail for a tag split across chunks while preventing unbounded buffering.
      buffer = buffer.slice(-1_000_000);
    }
  };

  async function feed(chunk: Buffer | string): Promise<void> {
    buffer += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : chunk;
    await processBuffer(false);
  }

  for await (const chunk of source) {
    await feed(chunk as Buffer);
  }

  await processBuffer(true);
  if (!rootWritten) throw new Error("Invalid XMLTV source");

  await new Promise<void>((resolve, reject) => {
    writer.once("finish", resolve);
    writer.once("error", reject);
    writer.end();
  });

  return writtenPrograms;
}

async function write(
  writer: ReturnType<typeof createWriteStream>,
  chunk: string
): Promise<void> {
  if (writer.write(chunk)) return;
  await new Promise<void>((resolve, reject) => {
    const onDrain = () => { cleanup(); resolve(); };
    const onError = (error: Error) => { cleanup(); reject(error); };
    const cleanup = () => {
      writer.off("drain", onDrain);
      writer.off("error", onError);
    };
    writer.once("drain", onDrain);
    writer.once("error", onError);
  });
}
