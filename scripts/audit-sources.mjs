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

const blockedStatuses = new Set([401, 403, 406, 429, 500, 502, 503, 504]);

function normalizeHtml(body) {
  return body
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1_000_000);
}

async function fetchSnapshot(url) {
  const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "CardScout-India-source-audit/1.0 (+https://github.com/someshfengde/cardscout-india)" }, signal: AbortSignal.timeout(12000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const isHtml = contentType.includes("text/html");
  const content = isHtml ? normalizeHtml(bytes.toString("utf8")) : bytes;
  const contentBlocked = isHtml && /(?:security violation|incident id:|access denied|captcha|enable javascript and cookies to continue)/i.test(content);
  const checkable = response.status < 400 && !contentBlocked;
  const hash = checkable ? createHash("sha256").update(content).digest("hex").slice(0, 20) : null;
  return { status: response.status, hash, checkable, contentBlocked };
}

function classify(snapshot, url) {
  if (snapshot.contentBlocked) blocked.push(`CONTENT-BLOCKED ${url}`);
  else if (blockedStatuses.has(snapshot.status)) blocked.push(`${snapshot.status} ${url}`);
  else if (!snapshot.checkable) failed.push(`${snapshot.status} ${url}`);
}

async function audit(url) {
  try {
    const snapshot = await fetchSnapshot(url);
    const prior = previous[url];
    const changeCandidate = !baseline && snapshot.checkable && prior?.status < 400 && prior.hash && prior.hash !== snapshot.hash;

    if (changeCandidate) {
      const confirmation = await fetchSnapshot(url);
      if (!confirmation.checkable || confirmation.hash !== snapshot.hash) {
        next[url] = prior;
        blocked.push(`CONTENT-UNSTABLE ${url}`);
        return;
      }
      changed.push(url);
    }

    next[url] = { status: snapshot.status, hash: snapshot.hash };
    classify(snapshot, url);
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
