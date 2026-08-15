import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parse } from "yaml";

const cardsDoc = parse(await readFile(new URL("../data/cards.yml", import.meta.url), "utf8"));
const discoveryDoc = parse(await readFile(new URL("../data/discovery.yml", import.meta.url), "utf8"));
const issuerDoc = parse(await readFile(new URL("../data/issuers.yml", import.meta.url), "utf8"));
const retiredDoc = parse(await readFile(new URL("../data/retired.yml", import.meta.url), "utf8"));
const urls = [...new Set([
  ...cardsDoc.cards.map((card) => card.source),
  ...discoveryDoc.cards.map((card) => card.source),
  ...retiredDoc.cards.map((card) => card.source),
  ...issuerDoc.issuers.map((issuer) => issuer.catalog),
])];
const previous = JSON.parse(await readFile(new URL("../data/source-state.json", import.meta.url), "utf8").catch(() => "{}"));
const baseline = process.argv.includes("--baseline");
const next = {};
const changed = [];
const failed = [];
const blocked = [];

async function audit(url) {
  try {
    const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "CardScout-India-source-audit/1.0 (+https://github.com/someshfengde/cardscout-india)" }, signal: AbortSignal.timeout(12000) });
    const body = (await response.text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/\s+/g, " ").slice(0, 1_000_000);
    const hash = createHash("sha256").update(body).digest("hex").slice(0, 20);
    next[url] = { status: response.status, hash };
    if ([401, 403, 406, 429, 500, 502, 503, 504].includes(response.status)) blocked.push(`${response.status} ${url}`);
    else if (response.status >= 400) failed.push(`${response.status} ${url}`);
    if (!baseline && previous[url] && (previous[url].hash !== hash || previous[url].status !== response.status)) changed.push(url);
  } catch (error) {
    next[url] = { status: 0, hash: null };
    blocked.push(`ERROR ${url}: ${error.message}`);
  }
}

for (let i = 0; i < urls.length; i += 12) await Promise.all(urls.slice(i, i + 12).map(audit));

await writeFile(new URL("../data/source-state.json", import.meta.url), `${JSON.stringify(next, null, 2)}\n`);
await writeFile(new URL("../source-audit.md", import.meta.url), [
  "# Source audit",
  "",
  `Checked ${urls.length} official sources.`,
  `Changed since the previous audit: ${changed.length}.`,
  `Broken or error responses: ${failed.length}.`,
  `Automation-blocked sources: ${blocked.length}.`,
  "",
  ...(changed.length ? ["## Changed", "", ...changed.map((url) => `- ${url}`), ""] : []),
  ...(failed.length ? ["## Needs attention", "", ...failed.map((item) => `- ${item}`), ""] : []),
  ...(blocked.length ? ["## Blocked from automated checking", "", "These sources require manual review; they are not treated as broken.", "", ...blocked.map((item) => `- ${item}`), ""] : []),
].join("\n"));

if (failed.length) console.warn(`${failed.length} source(s) need attention.`);
if (blocked.length) console.warn(`${blocked.length} source(s) block automated access.`);
console.log(`${changed.length} source fingerprint(s) changed.`);
