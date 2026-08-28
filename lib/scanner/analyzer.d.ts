import type { Finding } from "./types";

export function analyzePosture(input: {
  httpsReachable: boolean;
  httpsStatus?: number | null;
  httpRedirectsToHttps: boolean;
  headers?: Record<string, string>;
}): { score: number; grade: string; findings: Finding[]; summary: string };
