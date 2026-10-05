import assert from "node:assert/strict";
import test from "node:test";
import { normalizeChannelName } from "../dist/normalizer/channel-name.js";

test("strips provider prefixes without stripping real country prefixes", () => {
  assert.equal(normalizeChannelName("EU | Sky Sports News HD"), "SKY SPORTS NEWS");
  assert.equal(normalizeChannelName("UK | Sky Sports News HD"), "UK SKY SPORTS NEWS");
});

test("normalizes plus one variants", () => {
  assert.equal(normalizeChannelName("ITV 1 +1"), "ITV 1 PLUS1");
});
