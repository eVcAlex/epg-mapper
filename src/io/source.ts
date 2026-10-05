import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { createGunzip } from "node:zlib";

function shouldGunzip(source: string, contentEncoding?: string | null): boolean {
  return Boolean(contentEncoding?.toLowerCase().includes("gzip")) || /\.gz(?:$|[?#])/i.test(source);
}

export async function openSource(source: string): Promise<Readable> {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source, {
      headers: { "user-agent": "epg-mapper/0.1" }
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch ${source}: HTTP ${response.status}`);
    }

    let stream = Readable.fromWeb(response.body as never);
    if (shouldGunzip(source, response.headers.get("content-encoding"))) {
      stream = stream.pipe(createGunzip());
    }
    return stream;
  }

  const stream = createReadStream(source);
  return /\.gz$/i.test(source) ? stream.pipe(createGunzip()) : stream;
}
