import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
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
});
