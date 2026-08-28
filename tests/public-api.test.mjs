import test from "node:test";
import assert from "node:assert/strict";
import { allowedOrigin, anonymousOwnerKey, requirePublicOrigin } from "../lib/scanner/public-api.mjs";

test("accepts the GitHub Pages and public Site origins", () => {
  for (const origin of [
    "https://madhav1337.github.io",
    "https://cloudscope-scanner.zentex1337.chatgpt.site",
  ]) {
    const request = new Request("https://api.example.test/api/scans", { headers: { Origin: origin } });
    assert.equal(allowedOrigin(request), origin);
  }
});

test("accepts a verified same-origin request when the browser omits Origin", () => {
  const origin = "https://cloudscope-scanner.zentex1337.chatgpt.site";
  const request = new Request(`${origin}/api/scans`, {
    headers: { "Sec-Fetch-Site": "same-origin" },
  });
  assert.equal(requirePublicOrigin(request), origin);
});

test("rejects untrusted and missing browser origins", () => {
  for (const origin of ["https://attacker.example", null]) {
    const headers = origin ? { Origin: origin } : {};
    const request = new Request("https://api.example.test/api/scans", { headers });
    assert.throws(() => requirePublicOrigin(request));
  }
});

test("rejects a forged same-origin hint on an untrusted request URL", () => {
  const request = new Request("https://attacker.example/api/scans", {
    headers: { "Sec-Fetch-Site": "same-origin" },
  });
  assert.throws(() => requirePublicOrigin(request));
});

test("derives a stable anonymous owner key without storing the browser id", async () => {
  const id = "8e32cb18-e4aa-48b5-b41d-ec99da28bb3a";
  const request = new Request("https://api.example.test/api/scans", {
    headers: { "X-CloudScope-Client": id },
  });
  const first = await anonymousOwnerKey(request);
  const second = await anonymousOwnerKey(request);
  assert.equal(first, second);
  assert.match(first, /^anon:[0-9a-f]{64}$/);
  assert.equal(first.includes(id), false);
});

test("rejects malformed anonymous client ids", async () => {
  const request = new Request("https://api.example.test/api/scans", {
    headers: { "X-CloudScope-Client": "not-a-uuid" },
  });
  await assert.rejects(() => anonymousOwnerKey(request));
});
