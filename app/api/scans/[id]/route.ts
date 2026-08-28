import { env } from "cloudflare:workers";
import {
  anonymousOwnerKey,
  corsHeaders,
  PublicApiError,
  requirePublicOrigin,
  withCors,
} from "@/lib/scanner/public-api.mjs";
import type { ScanReport } from "@/lib/scanner/types";

export async function OPTIONS(request: Request) {
  try {
    const origin = requirePublicOrigin(request);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  } catch (error) {
    return apiError(error);
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  let origin: string | null = null;
  try {
    origin = requirePublicOrigin(request);
    const ownerKey = await anonymousOwnerKey(request);
    const { id } = await context.params;
    const row = await env.DB.prepare(
      `SELECT report_json FROM scans WHERE id = ? AND user_email = ? LIMIT 1`,
    ).bind(id, ownerKey).first<{ report_json: string }>();
    if (!row) throw new PublicApiError("Report not found.", 404);
    return withCors(Response.json({ report: JSON.parse(row.report_json) as ScanReport }), origin);
  } catch (error) {
    return apiError(error, origin);
  }
}

function apiError(error: unknown, origin?: string | null) {
  const message = error instanceof Error ? error.message : "Report unavailable.";
  const status = error instanceof PublicApiError ? error.status : 503;
  const response = Response.json({ error: message }, { status });
  return origin ? withCors(response, origin) : response;
}
