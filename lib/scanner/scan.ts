import { analyzePosture } from "./analyzer.mjs";
import { assertPublicDns, normalizeTarget } from "./target.mjs";
import type { ScanReport, WebEndpoint } from "./types";

const POLICY_VERSION = 1;
const SAFE_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "server",
  "x-powered-by",
];

type Probe = {
  reachable: boolean;
  status: number | null;
  headers: Record<string, string>;
  location: string | null;
  finalUrl: string | null;
};

export async function scanDomain(rawTarget: string): Promise<ScanReport> {
  const target = normalizeTarget(rawTarget);
  await assertPublicDns(target.hostname);

  const endpointSpecs = [
    { port: 443, scheme: "https" as const, url: `https://${target.hostname}/` },
    { port: 80, scheme: "http" as const, url: `http://${target.hostname}/` },
    { port: 8443, scheme: "https" as const, url: `https://${target.hostname}:8443/` },
    { port: 8080, scheme: "http" as const, url: `http://${target.hostname}:8080/` },
  ];
  const probes = await Promise.all(endpointSpecs.map((spec) => probeWebEndpoint(spec.url, target.hostname, spec.port === 443)));
  const https = probes[0];
  const http = probes[1];
  const redirectsToHttps = Boolean(http.location && new URL(http.location, endpointSpecs[1].url).protocol === "https:");
  const analyzed = analyzePosture({
    httpsReachable: https.reachable,
    httpsStatus: https.status,
    httpRedirectsToHttps: redirectsToHttps,
    headers: https.headers,
  });

  const endpoints: WebEndpoint[] = endpointSpecs.map((spec, index) => ({
    port: spec.port,
    scheme: spec.scheme,
    reachable: probes[index].reachable,
    status: probes[index].status,
    note: probes[index].reachable
      ? "An HTTP-compatible response was received; this does not identify every service on the port."
      : "No HTTP-compatible response was received within the bounded check.",
  }));

  return {
    id: crypto.randomUUID(),
    policyVersion: POLICY_VERSION,
    target: target.displayTarget,
    hostname: target.hostname,
    scannedAt: new Date().toISOString(),
    score: analyzed.score,
    grade: analyzed.grade,
    summary: analyzed.summary,
    finalUrl: https.finalUrl,
    findings: analyzed.findings,
    endpoints,
    disclaimer: "CloudScope performs bounded, passive HTTP checks against public web endpoints. It is not a vulnerability assessment or a raw TCP port scan.",
  };
}

async function probeWebEndpoint(url: string, originalHostname: string, followSafeRedirect: boolean): Promise<Probe> {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "CloudScope-Security-Scanner/1.0",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
        Range: "bytes=0-16384",
      },
      signal: AbortSignal.timeout(7000),
    });
    const headers = pickHeaders(response.headers);
    const location = response.headers.get("location");
    await response.body?.cancel();

    if (followSafeRedirect && location && response.status >= 300 && response.status < 400) {
      const next = new URL(location, url);
      if (next.username || next.password || next.port || next.protocol !== "https:") {
        return { reachable: true, status: response.status, headers, location, finalUrl: url };
      }
      const normalized = normalizeTarget(next.hostname);
      const isRelated = normalized.hostname === originalHostname || normalized.hostname === `www.${originalHostname}` || originalHostname === `www.${normalized.hostname}`;
      if (isRelated) {
        await assertPublicDns(normalized.hostname);
        const followed = await probeWebEndpoint(next.toString(), normalized.hostname, false);
        if (followed.reachable) return { ...followed, location, finalUrl: next.toString() };
      }
    }
    return { reachable: true, status: response.status, headers, location, finalUrl: url };
  } catch {
    return { reachable: false, status: null, headers: {}, location: null, finalUrl: null };
  }
}

function pickHeaders(headers: Headers): Record<string, string> {
  const selected: Record<string, string> = {};
  for (const key of SAFE_HEADERS) {
    const value = headers.get(key);
    if (value) selected[key] = value.slice(0, 512);
  }
  return selected;
}
