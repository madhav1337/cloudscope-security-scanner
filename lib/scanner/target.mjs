const BLOCKED_NAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);
const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".home", ".lan", ".test", ".invalid", ".example", ".onion"];

export function normalizeTarget(raw) {
  const value = raw.trim();
  if (!value || value.length > 253) throw new Error("Enter a valid public domain.");
  if (/\s/.test(value)) throw new Error("Domains cannot contain spaces.");

  let parsed;
  try {
    parsed = new URL(value.includes("://") ? value : `https://${value}`);
  } catch {
    throw new Error("Enter a hostname such as example.com.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Only public HTTP and HTTPS targets are supported.");
  if (parsed.username || parsed.password) throw new Error("Credentials are not allowed in scan targets.");
  if (parsed.port) throw new Error("Enter a domain without a custom port. CloudScope checks a fixed endpoint set safely.");
  if ((parsed.pathname && parsed.pathname !== "/") || parsed.search || parsed.hash) throw new Error("Enter a domain only, without a path, query, or fragment.");

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_NAMES.has(hostname) || BLOCKED_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) throw new Error("Private, reserved, and local network names cannot be scanned.");
  if (isIpLiteral(hostname)) throw new Error("Use a public domain name rather than a raw IP address.");
  if (!hostname.includes(".") || !isValidHostname(hostname)) throw new Error("Enter a valid public domain name.");
  return { hostname, displayTarget: hostname };
}

function isValidHostname(hostname) {
  return hostname.split(".").every((label) => label.length >= 1 && label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(label));
}

function isIpLiteral(hostname) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

export async function assertPublicDns(hostname) {
  const [a, aaaa] = await Promise.all([resolveDns(hostname, "A"), resolveDns(hostname, "AAAA")]);
  const addresses = [...a, ...aaaa];
  if (addresses.length === 0) throw new Error("The domain did not resolve to a public web address.");
  if (addresses.some((ip) => !isPublicIp(ip))) throw new Error("This domain resolves to a private, reserved, or local network address.");
  return addresses;
}

async function resolveDns(hostname, type) {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", hostname);
  url.searchParams.set("type", type);
  const response = await fetch(url, { redirect: "manual", headers: { Accept: "application/dns-json" }, signal: AbortSignal.timeout(5000) });
  if (response.status >= 300 && response.status < 400) throw new Error("Public DNS validation returned an unexpected redirect.");
  if (!response.ok) throw new Error("Public DNS validation is temporarily unavailable.");
  const body = await response.json();
  if (body.Status !== 0) return [];
  const wanted = type === "A" ? 1 : 28;
  return (body.Answer ?? []).filter((answer) => answer.type === wanted).map((answer) => answer.data);
}

export function isPublicIp(ip) {
  if (ip.includes(":")) {
    const value = ip.toLowerCase();
    return !(value === "::" || value === "::1" || value.includes("%") || value.startsWith("::ffff:") || value.startsWith("fc") || value.startsWith("fd") || /^fe[89ab]/.test(value) || value.startsWith("ff") || value.startsWith("2001:db8") || value.startsWith("2001:10") || value.startsWith("2001:2:"));
  }
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 192 && b === 88 && c === 99) || (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
}
