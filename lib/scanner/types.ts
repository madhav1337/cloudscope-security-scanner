export type Severity = "high" | "medium" | "low" | "info";
export type FindingStatus = "pass" | "fail" | "warn" | "info";

export type Finding = {
  id: string;
  title: string;
  category: "transport" | "headers" | "privacy";
  severity: Severity;
  status: FindingStatus;
  evidence: string;
  recommendation: string;
  points: number;
  maxPoints: number;
};

export type WebEndpoint = {
  port: number;
  scheme: "http" | "https";
  reachable: boolean;
  status: number | null;
  note: string;
};

export type ScanReport = {
  id: string;
  policyVersion: number;
  target: string;
  hostname: string;
  scannedAt: string;
  score: number;
  grade: string;
  summary: string;
  finalUrl: string | null;
  findings: Finding[];
  endpoints: WebEndpoint[];
  disclaimer: string;
};

export type ScanHistoryItem = Pick<ScanReport, "id" | "target" | "hostname" | "score" | "grade" | "scannedAt">;
