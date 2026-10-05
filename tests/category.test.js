import assert from "node:assert/strict";
import test from "node:test";
import { classifyCategory } from "../dist/classifier/category.js";

test("puts UK sports into sports", () => {
  const category = classifyCategory({ extinf: "", name: "Sky Sports Main Event", groupTitle: "UK", url: "" }, "UK");
  assert.equal(category, "sports");
});

test("keeps NFL as a dedicated category", () => {
  const category = classifyCategory({ extinf: "", name: "NFL Network", groupTitle: "US Sports", url: "" }, "US");
  assert.equal(category, "nfl");
});
