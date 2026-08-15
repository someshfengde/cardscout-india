import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const catalog = JSON.parse(await readFile(new URL("../app/generated/catalog.json", import.meta.url), "utf8"));
const retired = parse(await readFile(new URL("../data/retired.yml", import.meta.url), "utf8")).cards;

test("catalog has broad, unique, source-backed coverage", () => {
  assert.ok(catalog.cards.length >= 300);
  assert.ok(catalog.issuers.length >= 40);
  assert.ok(catalog.meta.detailedCardCount >= 200);
  assert.ok(catalog.meta.discoveryCardCount <= 110);
  assert.ok(catalog.meta.detailedIssuerCount >= 22);
  assert.equal(new Set(catalog.cards.map((card) => card.id)).size, catalog.cards.length);
  assert.ok(catalog.cards.every((card) => card.source.startsWith("https://")));
  assert.ok(catalog.cards.every((card) => card.categories.length && card.highlights.length));
  assert.equal(catalog.meta.representedIssuerCount, new Set(catalog.cards.map((card) => card.issuer)).size);
  assert.equal(catalog.meta.representedIssuerCount, catalog.meta.issuerCount);
  assert.equal(catalog.issuers.reduce((sum, issuer) => sum + issuer.cardCount, 0), catalog.cards.length);
  assert.ok(catalog.issuers.every((issuer) => Number.isInteger(issuer.cardCount) && issuer.cardCount >= 0));
});

test("fees and verification states are machine readable", () => {
  assert.ok(catalog.cards.every((card) => card.annual_fee === null || Number.isFinite(card.annual_fee) && card.annual_fee >= 0));
  assert.ok(catalog.cards.every((card) => card.joining_fee === null || Number.isFinite(card.joining_fee) && card.joining_fee >= 0));
  assert.ok(catalog.cards.every((card) => ["verified", "partial", "discovered"].includes(card.verification)));
  assert.ok(catalog.cards.every((card) => card.verification === "discovered" ? card.annual_fee === null : Number.isFinite(card.annual_fee)));
  assert.ok(catalog.cards.every((card) => card.verification === "discovered" || Number.isFinite(card.forex_markup) && card.forex_markup >= 0));
  assert.ok(catalog.cards.every((card) => card.verification === "discovered" || ["none", "conditional", "included", "unlimited"].includes(card.lounge)));
  assert.ok(catalog.cards.every((card) => card.research_note === undefined || typeof card.research_note === "string" && card.research_note.length > 0));
  assert.ok(catalog.cards.filter((card) => card.research_note).length >= 100);
});

test("retired products are source-backed and excluded from the active catalog", () => {
  const activeIds = new Set(catalog.cards.map((card) => card.id));
  assert.equal(catalog.meta.retiredCardCount, retired.length);
  assert.ok(retired.length >= 18);
  assert.ok(retired.every((card) => !activeIds.has(card.id)));
  assert.ok(retired.every((card) => card.source.startsWith("https://") && card.reason.length > 0));
});
