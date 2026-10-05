import assert from "node:assert/strict";
import test from "node:test";
import { classifyMarket } from "../dist/classifier/market.js";
import { classifyCategory } from "../dist/classifier/category.js";
import { sectionFor } from "../dist/classifier/section.js";

test("classifies MegaOTT EU-prefixed UK groups as UK, not EU", () => {
  const entry = {
    extinf: "",
    groupTitle: "EU | UK GENERAL",
    name: "UK| BBC 1 HD",
    url: "http://example.invalid"
  };
  assert.equal(classifyMarket(entry), "UK");
});

test("keeps the dedicated NFL bucket", () => {
  const entry = {
    extinf: "",
    groupTitle: "AM | USA NFL",
    name: "NFL Network",
    url: "http://example.invalid"
  };
  const market = classifyMarket(entry);
  assert.equal(market, "US");
  assert.equal(classifyCategory(entry, market), "nfl");
  assert.equal(sectionFor(entry, market, "nfl"), "US - NFL");
});

test("keeps UK sports before UK entertainment", () => {
  const sports = {
    extinf: "",
    groupTitle: "EU | UK SKY SPORTS",
    name: "UK| SKY SPORTS MAIN EVENT HD",
    url: "http://example.invalid"
  };
  const entertainment = {
    extinf: "",
    groupTitle: "EU | UK ENTERTAINMENT",
    name: "UK| ITV 1 HD",
    url: "http://example.invalid"
  };

  assert.equal(sectionFor(sports, "UK", "sports"), "UK SPORTS - SKY/TNT/PREMIER");
  assert.equal(sectionFor(entertainment, "UK", "entertainment"), "UK ENTERTAINMENT");
});
