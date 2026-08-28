import { env } from "cloudflare:workers";
import { scanDomain } from "@/lib/scanner/scan";
import { normalizeTarget } from "@/lib/scanner/target.mjs";
import {
  anonymousOwnerKey,
  corsHeaders,
  PublicApiError,
  requirePublicOrigin,
  withCors,
} from "@/lib/scanner/public-api.mjs";
import type { ScanHistoryItem } from "@/lib/scanner/types";

const MAX_CLIENT_SCANS_PER_HOUR = 10;
const MAX_TARGET_SCANS_PER_HOUR = 5;
const MAX_GLOBAL_SCANS_PER_HOUR = 200;

export async function OPTIONS(request: Request) {
  try {
    const origin = requirePublicOrigin(request);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: Request) {
  let origin: string | null = null;
  try {
    origin = requirePublicOrigin(request);
    const ownerKey = await anonymousOwnerKey(request);
    const result = await env.DB.prepare(
      `SELECT id, target, hostname, score, grade, created_at AS scannedAt
       FROM scans
       WHERE user_email = ?
       ORDER BY created_at DESC
       LIMIT 12`,
    ).bind(ownerKey).all<ScanHistoryItem>();
    return withCors(Response.json({ scans: result.results }), origin);
  } catch (error) {
    return apiError(error, origin);
  }
}

export async function POST(request: Request) {
  let origin: string | null = null;
  try {
    origin = requirePublicOrigin(request);
    const ownerKey = await anonymousOwnerKey(request);
    const payload = await request.json() as { target?: string; authorized?: boolean };
    if (payload.authorized !== true) {
      throw new PublicApiError("Confirm that you own or are authorized to assess this domain.", 400);
    }

    const target = payload.target?.trim() ?? "";
    if (!target) throw new PublicApiError("Enter a public domain to scan.", 400);
    const normalized = normalizeTarget(target);

    const rate = await env.DB.prepare(
      `SELECT
         SUM(CASE WHEN user_email = ? THEN 1 ELSE 0 END) AS clientCount,
         SUM(CASE WHEN hostname = ? THEN 1 ELSE 0 END) AS targetCount,
         COUNT(*) AS globalCount
       FROM scans
       WHERE created_at >= datetime('now', '-1 hour')`,
    ).bind(ownerKey, normalized.hostname).first<{
      clientCount: number;
      targetCount: number;
      globalCount: number;
    }>();

    if ((rate?.clientCount ?? 0) >= MAX_CLIENT_SCANS_PER_HOUR) {
      throw new PublicApiError("This browser has reached its hourly scan limit. Try again later.", 429);
    }
    if ((rate?.targetCount ?? 0) >= MAX_TARGET_SCANS_PER_HOUR) {
      throw new PublicApiError("This domain has reached its hourly scan limit. Try again later.", 429);
    }
    if ((rate?.globalCount ?? 0) >= MAX_GLOBAL_SCANS_PER_HOUR) {
      throw new PublicApiError("CloudScope is at its current hourly capacity. Try again later.", 429);
    }

    const report = await scanDomain(normalized.hostname);
    await env.DB.prepare(
      `INSERT INTO scans
       (id, user_email, target, hostname, score, grade, status, policy_version, report_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
    ).bind(
      report.id,
      ownerKey,
      report.target,
      report.hostname,
      report.score,
      report.grade,
      report.policyVersion,
      JSON.stringify(report),
      report.scannedAt,
    ).run();
    return withCors(Response.json({ report }, { status: 201 }), origin);
  } catch (error) {
    return apiError(error, origin);
  }
}

function apiError(error: unknown, origin?: string | null) {
  const message = error instanceof Error ? error.message : "The scan could not be completed.";
  const databaseUnavailable = message.includes("no such table") || message.includes("DB");
  const status = error instanceof PublicApiError ? error.status : databaseUnavailable ? 503 : 400;
  const response = Response.json(
    { error: databaseUnavailable ? "Scan history is temporarily unavailable." : message },
    { status },
  );
  return origin ? withCors(response, origin) : response;
}
