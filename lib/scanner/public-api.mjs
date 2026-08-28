const PUBLIC_ORIGINS = new Set([
  "https://madhav1337.github.io",
  "https://cloudscope-scanner.zentex1337.chatgpt.site",
  "http://localhost:3000",
  "http://localhost:4173",
]);

const CLIENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function allowedOrigin(request) {
  const origin = request.headers.get("origin");
  return origin && PUBLIC_ORIGINS.has(origin) ? origin : null;
}

export function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-CloudScope-Client",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function withCors(response, origin) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function requirePublicOrigin(request) {
  const origin = allowedOrigin(request);
  if (!origin) throw new PublicApiError("This scanner request must come from the CloudScope web app.", 403);
  return origin;
}

export async function anonymousOwnerKey(request) {
  const clientId = request.headers.get("x-cloudscope-client")?.trim() ?? "";
  if (!CLIENT_ID_PATTERN.test(clientId)) {
    throw new PublicApiError("Your anonymous browser session could not be verified. Refresh and try again.", 400);
  }
  const bytes = new TextEncoder().encode(`cloudscope-v1:${clientId.toLowerCase()}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `anon:${hash}`;
}

export class PublicApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "PublicApiError";
    this.status = status;
  }
}
