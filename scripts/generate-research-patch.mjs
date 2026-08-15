import { readFile } from "node:fs/promises";
import { parse, stringify } from "yaml";

const fragmentPaths = process.argv.slice(2);
if (fragmentPaths.length === 0) {
  throw new Error("Usage: node scripts/generate-research-patch.mjs research-batch-*.yml");
}

const cardsPath = new URL("../data/cards.yml", import.meta.url);
const discoveryPath = new URL("../data/discovery.yml", import.meta.url);
const issuersPath = new URL("../data/issuers.yml", import.meta.url);
const [cardsText, discoveryText, issuersText] = await Promise.all([
  readFile(cardsPath, "utf8"),
  readFile(discoveryPath, "utf8"),
  readFile(issuersPath, "utf8"),
]);
const cardsDoc = parse(cardsText);
const discoveryDoc = parse(discoveryText);
const issuersDoc = parse(issuersText);
const detailedIds = new Set(cardsDoc.cards.map((card) => card.id));
const issuerNames = new Set(issuersDoc.issuers.map((issuer) => issuer.name));
const allowedLounge = new Set(["none", "conditional", "included", "unlimited"]);
const requiredStrings = ["id", "issuer", "name", "network", "reward", "verification", "source"];
const proposals = [];
const unresolved = [];

for (const path of fragmentPaths) {
  const fragment = parse(await readFile(path, "utf8"));
  if (!Array.isArray(fragment?.cards)) throw new Error(`${path} must contain a cards array`);
  proposals.push(...fragment.cards);
  if (Array.isArray(fragment.unresolved)) unresolved.push(...fragment.unresolved);
}

const seen = new Set();
for (const card of proposals) {
  if (!card?.id || seen.has(card.id)) throw new Error(`Missing or duplicate proposal id: ${card?.id}`);
  if (detailedIds.has(card.id)) throw new Error(`Already detailed: ${card.id}`);
  if (!issuerNames.has(card.issuer)) throw new Error(`Unknown issuer: ${card.issuer}`);
  for (const key of requiredStrings) {
    if (typeof card[key] !== "string" || card[key].trim() === "") throw new Error(`Invalid ${key}: ${card.id}`);
  }
  for (const key of ["joining_fee", "annual_fee", "forex_markup"]) {
    if (!Number.isFinite(card[key]) || card[key] < 0) throw new Error(`Invalid ${key}: ${card.id}`);
  }
  if (card.waiver_spend !== null && (!Number.isFinite(card.waiver_spend) || card.waiver_spend < 0)) throw new Error(`Invalid waiver_spend: ${card.id}`);
  if (!Array.isArray(card.categories) || card.categories.length === 0) throw new Error(`Missing categories: ${card.id}`);
  if (!Array.isArray(card.highlights) || card.highlights.length === 0) throw new Error(`Missing highlights: ${card.id}`);
  if (!allowedLounge.has(card.lounge)) throw new Error(`Invalid lounge: ${card.id}`);
  if (!["verified", "partial"].includes(card.verification)) throw new Error(`Invalid verification: ${card.id}`);
  if (!card.source.startsWith("https://")) throw new Error(`Invalid source: ${card.id}`);
  seen.add(card.id);
}

proposals.sort((a, b) => a.issuer.localeCompare(b.issuer) || a.name.localeCompare(b.name));
const promotedIds = new Set(proposals.map((card) => card.id));
const remainingDiscoveries = discoveryDoc.cards.filter((card) => !promotedIds.has(card.id));
const remainingIssuers = new Set(remainingDiscoveries.map((card) => card.issuer));
const promotedIssuers = new Set(proposals.map((card) => card.issuer));

const yaml = stringify({ cards: proposals }, { lineWidth: 0 });
const addition = yaml.replace(/^cards:\n/, "").trimEnd();
const cardsLines = cardsText.trimEnd().split("\n");
const lastCardLine = cardsLines.at(-1);
const discoveryLines = discoveryText.split("\n");

console.log("*** Begin Patch");
console.log(`*** Update File: ${cardsPath.pathname}`);
console.log("@@");
console.log(` ${lastCardLine}`);
console.log("+");
console.log("+  # Fleet research promotion");
for (const line of addition.split("\n")) console.log(`+${line}`);

const unresolvedReasons = new Map(unresolved.filter((item) => item?.id && typeof item.reason === "string").map((item) => [item.id, item.reason]));
const nextDiscoveryLines = discoveryLines.filter((line) => ![...promotedIds].some((id) => line.includes(`id: ${id},`))).map((line) => {
  if (line.includes("research_note:")) return line;
  const match = line.match(/id: ([^,]+),/);
  const reason = match ? unresolvedReasons.get(match[1]) : null;
  return reason ? line.replace(/ }\s*$/, `, research_note: ${JSON.stringify(reason)} }`) : line;
});
if (nextDiscoveryLines.join("\n") !== discoveryLines.join("\n")) {
  console.log(`*** Update File: ${discoveryPath.pathname}`);
  console.log("@@");
  for (const line of discoveryLines) console.log(`-${line}`);
  for (const line of nextDiscoveryLines) console.log(`+${line}`);
}

const nextIssuerLines = issuersText.split("\n").map((line) => {
  const issuer = [...promotedIssuers].find((name) => line.includes(`name: ${name},`));
  return issuer && !remainingIssuers.has(issuer) ? line.replace("coverage: discovery", "coverage: detailed") : line;
});
if (nextIssuerLines.join("\n") !== issuersText.split("\n").join("\n")) {
  console.log(`*** Update File: ${issuersPath.pathname}`);
  console.log("@@");
  for (const line of issuersText.split("\n")) console.log(`-${line}`);
  for (const line of nextIssuerLines) console.log(`+${line}`);
}
console.log("*** End Patch");
