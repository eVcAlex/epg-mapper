import type { Readable } from "node:stream";
import { SaxesParser } from "saxes";
import type { EpgChannel } from "../types.js";

export async function readEpgChannels(source: Readable): Promise<EpgChannel[]> {
  const channels: EpgChannel[] = [];
  let inChannel = false;
  let inDisplayName = false;
  let currentId = "";
  let currentNames: string[] = [];
  let currentText = "";

  const parser = new SaxesParser({ xmlns: false });

  parser.on("opentag", (tag) => {
    if (String(tag.name) === "channel") {
      inChannel = true;
      currentId = String(tag.attributes.id ?? "");
      currentNames = [];
    } else if (inChannel && String(tag.name) === "display-name") {
      inDisplayName = true;
      currentText = "";
    }
  });

  const appendText = (value: string) => {
    if (inChannel && inDisplayName) currentText += value;
  };

  parser.on("text", appendText);
  parser.on("cdata", appendText);

  parser.on("closetag", (name) => {
    if (String(name) === "display-name" && inChannel && inDisplayName) {
      const displayName = currentText.trim();
      if (displayName) currentNames.push(displayName);
      inDisplayName = false;
      currentText = "";
    } else if (String(name) === "channel" && inChannel) {
      if (currentId) channels.push({ id: currentId, displayNames: currentNames });
      inChannel = false;
      currentId = "";
      currentNames = [];
    }
  });

  for await (const chunk of source) {
    parser.write(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
  }
  parser.close();

  return channels;
}
