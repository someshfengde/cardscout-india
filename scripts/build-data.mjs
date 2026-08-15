import { readFile, writeFile } from "node:fs/promises";
import { parse } from "yaml";

const cardsDoc = parse(await readFile(new URL("../data/cards.yml", import.meta.url), "utf8"));
const discoveryDoc = parse(await readFile(new URL("../data/discovery.yml", import.meta.url), "utf8"));
const issuersDoc = parse(await readFile(new URL("../data/issuers.yml", import.meta.url), "utf8"));
const retiredDoc = parse(await readFile(new URL("../data/retired.yml", import.meta.url), "utf8"));
const cards = cardsDoc?.cards;
const discoveries = discoveryDoc?.cards;
const issuers = issuersDoc?.issuers;
const retired = retiredDoc?.cards;

if (!Array.isArray(cards) || !Array.isArray(discoveries) || !Array.isArray(issuers) || !Array.isArray(retired)) {
  throw new Error("cards.yml, discovery.yml, issuers.yml, and retired.yml must contain arrays");
}

const required = ["id", "issuer", "name", "network", "joining_fee", "annual_fee", "reward", "categories", "highlights", "lounge", "forex_markup", "verification", "source"];
const ids = new Set();
const issuerNames = new Set(issuers.map((issuer) => issuer.name));
const allowedLounge = new Set(["none", "conditional", "included", "unlimited"]);

function isNonNegativeNumber(value) {
  return Number.isFinite(value) && value >= 0;
}

for (const [index, card] of cards.entries()) {
  for (const key of required) {
    if (!(key in card)) throw new Error(`Card ${index + 1} (${card.id ?? "unknown"}) is missing ${key}`);
  }
  if (ids.has(card.id)) throw new Error(`Duplicate card id: ${card.id}`);
  ids.add(card.id);
  if (!issuerNames.has(card.issuer)) throw new Error(`Unknown issuer on ${card.id}: ${card.issuer}`);
  if (!/^https:\/\//.test(card.source)) throw new Error(`Source must use HTTPS: ${card.id}`);
  if (!isNonNegativeNumber(card.joining_fee)) throw new Error(`Invalid joining fee: ${card.id}`);
  if (!isNonNegativeNumber(card.annual_fee)) throw new Error(`Invalid annual fee: ${card.id}`);
  if (card.waiver_spend !== null && !isNonNegativeNumber(card.waiver_spend)) throw new Error(`Invalid waiver spend: ${card.id}`);
  if (!isNonNegativeNumber(card.forex_markup)) throw new Error(`Invalid forex markup: ${card.id}`);
  if (!Array.isArray(card.categories) || card.categories.length === 0) throw new Error(`Categories missing: ${card.id}`);
  if (!Array.isArray(card.highlights) || card.highlights.length === 0) throw new Error(`Highlights missing: ${card.id}`);
  if (!allowedLounge.has(card.lounge)) throw new Error(`Invalid lounge state: ${card.id}`);
  if (!["verified", "partial"].includes(card.verification)) throw new Error(`Invalid verification: ${card.id}`);
}

for (const [index, card] of discoveries.entries()) {
  for (const key of ["id", "issuer", "name", "source"]) {
    if (!(key in card)) throw new Error(`Discovery ${index + 1} (${card.id ?? "unknown"}) is missing ${key}`);
  }
  if (ids.has(card.id)) throw new Error(`Duplicate card id: ${card.id}`);
  ids.add(card.id);
  if (!issuerNames.has(card.issuer)) throw new Error(`Unknown issuer on ${card.id}: ${card.issuer}`);
  if (!/^https:\/\//.test(card.source)) throw new Error(`Source must use HTTPS: ${card.id}`);
}

for (const [index, card] of retired.entries()) {
  for (const key of ["id", "issuer", "name", "reason", "source"]) {
    if (typeof card[key] !== "string" || card[key].trim() === "") throw new Error(`Retired record ${index + 1} (${card.id ?? "unknown"}) has invalid ${key}`);
  }
  if (ids.has(card.id)) throw new Error(`Duplicate active/retired card id: ${card.id}`);
  ids.add(card.id);
  if (!issuerNames.has(card.issuer)) throw new Error(`Unknown issuer on retired ${card.id}: ${card.issuer}`);
  if (!/^https:\/\//.test(card.source)) throw new Error(`Retired source must use HTTPS: ${card.id}`);
}

const discoveredCards = discoveries.map((card) => ({
  ...card,
  network: "Researching",
  joining_fee: null,
  annual_fee: null,
  waiver_spend: null,
  reward: card.research_note ? `Research note: ${card.research_note}` : "Discovery candidate; current availability, fees, rewards, and eligibility are being verified against the linked issuer source.",
  categories: ["discovery"],
  highlights: ["Official verification target linked", card.research_note ?? "Detailed verification in progress"],
  lounge: "researching",
  forex_markup: null,
  verification: "discovered",
}));

const allCards = [...cards, ...discoveredCards];
const cardCountByIssuer = new Map();
for (const card of allCards) cardCountByIssuer.set(card.issuer, (cardCountByIssuer.get(card.issuer) ?? 0) + 1);
const issuersWithCounts = issuers.map((issuer) => ({ ...issuer, cardCount: cardCountByIssuer.get(issuer.name) ?? 0 }));

const detailedIssuers = issuers.filter((issuer) => issuer.coverage === "detailed").length;
const output = {
  meta: {
    updatedAt: String(discoveryDoc.updated_at),
    cardCount: allCards.length,
    detailedCardCount: cards.length,
    discoveryCardCount: discoveredCards.length,
    issuerCount: issuers.length,
    representedIssuerCount: cardCountByIssuer.size,
    detailedIssuerCount: detailedIssuers,
    verifiedCount: cards.filter((card) => card.verification === "verified").length,
    retiredCardCount: retired.length,
  },
  issuers: issuersWithCounts,
  cards: allCards.sort((a, b) => a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name)),
};

await writeFile(new URL("../app/generated/catalog.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Validated ${allCards.length} cards (${cards.length} detailed + ${discoveredCards.length} discovery) across ${issuers.length} tracked issuers.`);
