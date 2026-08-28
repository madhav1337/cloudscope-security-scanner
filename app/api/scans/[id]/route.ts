import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import type { ScanReport } from "@/lib/scanner/types";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to view this report." }, { status: 401 });
  const { id } = await context.params;
  const row = await env.DB.prepare(
    `SELECT report_json FROM scans WHERE id = ? AND user_email = ? LIMIT 1`,
  ).bind(id, user.email).first<{ report_json: string }>();
  if (!row) return Response.json({ error: "Report not found." }, { status: 404 });
  return Response.json({ report: JSON.parse(row.report_json) as ScanReport });
}
