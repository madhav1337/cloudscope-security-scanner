import test from "node:test";
import assert from "node:assert/strict";
import { isPublicIp, normalizeTarget } from "../lib/scanner/target.mjs";

test("normalizes a public hostname", () => {
  assert.deepEqual(normalizeTarget("HTTPS://Example.COM/"), {
    hostname: "example.com",
    displayTarget: "example.com",
  });
});

test("rejects URLs that expand the scan surface", () => {
  for (const value of [
    "https://user:pass@example.com",
    "https://example.com/admin",
    "https://example.com:8443",
    "file:///etc/passwd",
  ]) {
    assert.throws(() => normalizeTarget(value), value);
  }
});

test("rejects local, reserved, and raw IP targets", () => {
  for (const value of ["localhost", "service.internal", "demo.test", "127.0.0.1", "[::1]"]) {
    assert.throws(() => normalizeTarget(value), value);
  }
});

test("classifies common non-public addresses", () => {
  for (const value of ["10.1.2.3", "100.64.0.1", "169.254.1.2", "172.20.1.2", "192.168.1.1", "198.51.100.4", "203.0.113.8", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"]) {
    assert.equal(isPublicIp(value), false, value);
  }
  assert.equal(isPublicIp("1.1.1.1"), true);
  assert.equal(isPublicIp("2606:4700:4700::1111"), true);
});
