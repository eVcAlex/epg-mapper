import assert from "node:assert/strict";
import test from "node:test";
import { matchEpg } from "../dist/matcher/epg.js";

const channels = [
  { id: "sky.news.uk", displayNames: ["Sky News", "Sky News HD"] },
  { id: "bbc.one.uk", displayNames: ["BBC One"] },
  { id: "skysportarena.it", displayNames: ["Sky Sports Arena"] }
];

test("matches exact tvg id first", () => {
  const result = matchEpg(
    { extinf: "", name: "Sky News", tvgId: "sky.news.uk", url: "" },
    "UK",
    channels
  );
  assert.equal(result.method, "exact-id");
  assert.equal(result.epgId, "sky.news.uk");
});

test("supports durable aliases", () => {
  const result = matchEpg(
    { extinf: "", name: "SKY NEWS UK", url: "" },
    "UK",
    channels,
    { "SKY NEWS UK": "sky.news.uk" }
  );
  assert.equal(result.method, "alias");
  assert.equal(result.epgId, "sky.news.uk");
});

test("does not map a UK channel to an explicitly Italian EPG id", () => {
  const result = matchEpg(
    { extinf: "", name: "Sky Sports Arena", url: "" },
    "UK",
    channels
  );
  assert.equal(result.method, "none");
});
