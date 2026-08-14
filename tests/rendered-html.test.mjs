import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the CardScout catalog", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /CardScout India/);
  assert.match(html, /Find a credit card/);
  assert.match(html, /Cards discovered/);
  assert.match(html, /Detailed card records/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|Your site is taking shape/);
});

test("publishes essential metadata", async () => {
  const html = await (await render()).text();
  assert.match(html, /<title>CardScout India/);
  assert.match(html, /community-maintained directory of Indian credit cards/i);
  assert.match(html, /property="og:title"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /CardScout India credit card catalog/);
});

test("publishes crawler discovery routes", async () => {
  const robots = await render("/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https:\/\/cardscout-india\.someshfengade\.chatgpt\.site\/sitemap\.xml/);

  const sitemap = await render("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /<loc>https:\/\/cardscout-india\.someshfengade\.chatgpt\.site<\/loc>/);
});
