import test from "node:test";
import assert from "node:assert/strict";
import { analyzePosture } from "../lib/scanner/analyzer.mjs";

test("awards a full score to a hardened response", () => {
  const result = analyzePosture({
    httpsReachable: true,
    httpsStatus: 200,
    httpRedirectsToHttps: true,
    headers: {
      "strict-transport-security": "max-age=31536000; includeSubDomains",
      "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=()",
    },
  });
  assert.equal(result.score, 100);
  assert.equal(result.grade, "A");
  assert.ok(result.findings.filter((finding) => finding.maxPoints > 0).every((finding) => finding.status === "pass"));
});

test("missing TLS and headers produces prioritized findings", () => {
  const result = analyzePosture({
    httpsReachable: false,
    httpRedirectsToHttps: false,
    headers: { server: "nginx/1.18", "x-powered-by": "Express" },
  });
  assert.equal(result.score, 0);
  assert.equal(result.grade, "F");
  assert.equal(result.findings.find((finding) => finding.id === "https")?.severity, "high");
  assert.equal(result.findings.find((finding) => finding.id === "server-disclosure")?.status, "info");
});

test("CSP frame-ancestors satisfies clickjacking protection", () => {
  const result = analyzePosture({
    httpsReachable: true,
    httpRedirectsToHttps: false,
    headers: { "content-security-policy": "frame-ancestors 'self'" },
  });
  assert.equal(result.findings.find((finding) => finding.id === "clickjacking-protection")?.status, "pass");
});

test("HSTS max-age zero does not receive transport points", () => {
  const result = analyzePosture({
    httpsReachable: true,
    httpRedirectsToHttps: true,
    headers: { "strict-transport-security": "max-age=0" },
  });
  assert.equal(result.findings.find((finding) => finding.id === "hsts")?.status, "fail");
});
