import type { EpgChannel } from "../types.js";
import { XMLParser } from "fast-xml-parser";

interface XmltvChannelNode {
  "@_id"?: string;
  "display-name"?: string | string[];
}

export function parseXmltvChannels(xml: string): EpgChannel[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });

  const root = parser.parse(xml) as { tv?: { channel?: XmltvChannelNode | XmltvChannelNode[] } };
  const channels = root.tv?.channel;
  if (!channels) return [];

  const nodes = Array.isArray(channels) ? channels : [channels];

  return nodes.flatMap((node) => {
    if (!node["@_id"]) return [];
    const names = node["display-name"];
    const displayNames = Array.isArray(names) ? names : names ? [names] : [];
    return [{ id: node["@_id"], displayNames }];
  });
}
