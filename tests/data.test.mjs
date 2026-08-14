import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalog = JSON.parse(await readFile(new URL("../app/generated/catalog.json", import.meta.url), "utf8"));

test("catalog has broad, unique, source-backed coverage", () => {
  assert.ok(catalog.cards.length >= 60);
  assert.ok(catalog.issuers.length >= 25);
  assert.equal(new Set(catalog.cards.map((card) => card.id)).size, catalog.cards.length);
  assert.ok(catalog.cards.every((card) => card.source.startsWith("https://")));
  assert.ok(catalog.cards.every((card) => card.categories.length && card.highlights.length));
});

test("fees and verification states are machine readable", () => {
  assert.ok(catalog.cards.every((card) => Number.isFinite(card.annual_fee) && card.annual_fee >= 0));
  assert.ok(catalog.cards.every((card) => Number.isFinite(card.joining_fee) && card.joining_fee >= 0));
  assert.ok(catalog.cards.every((card) => ["verified", "partial"].includes(card.verification)));
});
