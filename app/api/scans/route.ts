import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { scanDomain } from "@/lib/scanner/scan";
import type { ScanHistoryItem } from "@/lib/scanner/types";

const MAX_SCANS_PER_HOUR = 10;

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in to view scan history." }, { status: 401 });
  try {
    const result = await env.DB.prepare(
      `SELECT id, target, hostname, score, grade, created_at AS scannedAt
       FROM scans
       WHERE user_email = ?
       ORDER BY created_at DESC
       LIMIT 12`,
    ).bind(user.email).all<ScanHistoryItem>();
    return Response.json({ scans: result.results });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in before starting a scan." }, { status: 401 });
  try {
    const payload = await request.json() as { target?: string; authorized?: boolean };
    if (payload.authorized !== true) {
      return Response.json({ error: "Confirm that you own or are authorized to assess this domain." }, { status: 400 });
    }
    const target = payload.target?.trim() ?? "";
    if (!target) return Response.json({ error: "Enter a public domain to scan." }, { status: 400 });

    const rate = await env.DB.prepare(
      `SELECT COUNT(*) AS count
       FROM scans
       WHERE user_email = ? AND created_at >= datetime('now', '-1 hour')`,
    ).bind(user.email).first<{ count: number }>();
    if ((rate?.count ?? 0) >= MAX_SCANS_PER_HOUR) {
      return Response.json({ error: "Hourly scan limit reached. Try again later." }, { status: 429 });
    }

    const report = await scanDomain(target);
    await env.DB.prepare(
      `INSERT INTO scans
       (id, user_email, target, hostname, score, grade, status, policy_version, report_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
    ).bind(
      report.id,
      user.email,
      report.target,
      report.hostname,
      report.score,
      report.grade,
      report.policyVersion,
      JSON.stringify(report),
      report.scannedAt,
    ).run();
    return Response.json({ report }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The scan could not be completed.";
    if (message.includes("no such table")) return databaseError(error);
    return Response.json({ error: message }, { status: 400 });
  }
}

function databaseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Database unavailable";
  const unavailable = message.includes("no such table") || message.includes("DB");
  return Response.json(
    { error: unavailable ? "Scan history is being prepared. Please try again shortly." : "Scan history is temporarily unavailable." },
    { status: 503 },
  );
}
