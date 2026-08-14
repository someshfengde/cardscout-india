import { readFile, writeFile } from "node:fs/promises";
import { parse } from "yaml";

const cardsDoc = parse(await readFile(new URL("../data/cards.yml", import.meta.url), "utf8"));
const issuersDoc = parse(await readFile(new URL("../data/issuers.yml", import.meta.url), "utf8"));
const cards = cardsDoc?.cards;
const issuers = issuersDoc?.issuers;

if (!Array.isArray(cards) || !Array.isArray(issuers)) throw new Error("cards.yml and issuers.yml must contain arrays");

const required = ["id", "issuer", "name", "network", "joining_fee", "annual_fee", "reward", "categories", "highlights", "lounge", "forex_markup", "verification", "source"];
const ids = new Set();
const issuerNames = new Set(issuers.map((issuer) => issuer.name));

for (const [index, card] of cards.entries()) {
  for (const key of required) {
    if (!(key in card)) throw new Error(`Card ${index + 1} (${card.id ?? "unknown"}) is missing ${key}`);
  }
  if (ids.has(card.id)) throw new Error(`Duplicate card id: ${card.id}`);
  ids.add(card.id);
  if (!issuerNames.has(card.issuer)) throw new Error(`Unknown issuer on ${card.id}: ${card.issuer}`);
  if (!/^https:\/\//.test(card.source)) throw new Error(`Source must use HTTPS: ${card.id}`);
  if (!Array.isArray(card.categories) || card.categories.length === 0) throw new Error(`Categories missing: ${card.id}`);
  if (!["verified", "partial"].includes(card.verification)) throw new Error(`Invalid verification: ${card.id}`);
}

const detailedIssuers = issuers.filter((issuer) => issuer.coverage === "detailed").length;
const output = {
  meta: {
    updatedAt: String(cardsDoc.updated_at),
    cardCount: cards.length,
    issuerCount: issuers.length,
    detailedIssuerCount: detailedIssuers,
    verifiedCount: cards.filter((card) => card.verification === "verified").length,
  },
  issuers,
  cards: cards.sort((a, b) => a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name)),
};

await writeFile(new URL("../app/generated/catalog.json", import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Validated ${cards.length} cards across ${issuers.length} tracked issuers.`);
