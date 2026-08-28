"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock3,
  Globe2,
  History,
  LoaderCircle,
  LockKeyhole,
  Radar,
  Server,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Finding, ScanHistoryItem, ScanReport } from "@/lib/scanner/types";

const CLIENT_STORAGE_KEY = "cloudscope-anonymous-client";

export function ScannerDashboard() {
  const [target, setTarget] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  useEffect(() => {
    const anonymousId = getOrCreateClientId();
    let active = true;
    void fetch("/api/scans", {
      cache: "no-store",
      headers: { "X-CloudScope-Client": anonymousId },
    })
      .then((response) => response.json() as Promise<{ scans?: ScanHistoryItem[] }>)
      .then((data) => { if (active) setHistory(data.scans ?? []); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function loadHistory(anonymousId = getOrCreateClientId()) {
    try {
      const response = await fetch("/api/scans", {
        cache: "no-store",
        headers: { "X-CloudScope-Client": anonymousId },
      });
      const data = await response.json() as { scans?: ScanHistoryItem[] };
      if (response.ok) setHistory(data.scans ?? []);
    } catch {
      // History is secondary to the scanner and can recover on the next run.
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CloudScope-Client": getOrCreateClientId(),
        },
        body: JSON.stringify({ target, authorized }),
      });
      const data = await response.json() as { report?: ScanReport; error?: string };
      if (!response.ok || !data.report) throw new Error(data.error ?? "Scan failed.");
      setReport(data.report);
      void loadHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The scan could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  async function openReport(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/scans/${encodeURIComponent(id)}`, {
        headers: { "X-CloudScope-Client": getOrCreateClientId() },
      });
      const data = await response.json() as { report?: ScanReport; error?: string };
      if (!response.ok || !data.report) throw new Error(data.error ?? "Report unavailable.");
      setReport(data.report);
      window.scrollTo({ top: 260, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Report unavailable.");
    }
  }

  return (
    <div className="pb-10 pt-9">
      <section className="mb-8 grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-[#5ee9ae]">Public anonymous workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">Public attack-surface snapshot</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#78978b]">Run a bounded passive check, review evidence, and revisit reports from this browser—no account required.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
          <div className="grid size-9 place-items-center rounded-full bg-[#5ee9ae]/10 text-[#5ee9ae]"><LockKeyhole className="size-4" /></div>
          <div>
            <p className="text-sm font-medium text-white">No sign-in</p>
            <p className="font-mono text-[10px] text-[#668177]">anonymous browser history</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-[#5ee9ae]/20 bg-[#0b1915] p-5 shadow-[0_25px_80px_rgba(0,0,0,.25)] sm:p-7">
        <div className="absolute right-0 top-0 h-40 w-40 bg-[#5ee9ae]/[0.06] blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#5ee9ae]/20 bg-[#5ee9ae]/10 text-[#5ee9ae]"><Radar className="size-5" /></div>
          <div><h2 className="text-lg font-semibold text-white">Start a security scan</h2><p className="mt-1 text-sm text-[#78978b]">Enter one public domain. No paths, credentials, private IPs, or custom ports.</p></div>
        </div>
        <form onSubmit={submit} className="relative mt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Globe2 className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#668177]" />
              <Input value={target} onChange={(event) => setTarget(event.target.value)} placeholder="example.com" aria-label="Domain to scan" autoComplete="off" spellCheck={false} className="h-12 rounded-xl border-white/10 bg-[#07110f]/70 pl-11 font-mono text-sm text-white placeholder:text-[#456056]" />
            </div>
            <Button type="submit" disabled={loading || !target.trim() || !authorized} className="h-12 rounded-xl bg-[#5ee9ae] px-6 text-[#062016] hover:bg-[#7af2be] sm:min-w-40">
              {loading ? <><LoaderCircle className="animate-spin" /> Scanning</> : <><Radar /> Run scan</>}
            </Button>
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-[#78978b]">
            <Checkbox checked={authorized} onCheckedChange={(value) => setAuthorized(value === true)} className="mt-0.5 border-[#456056] data-[state=checked]:border-[#5ee9ae] data-[state=checked]:bg-[#5ee9ae]" />
            <span>I own this domain or have explicit authorization to assess its public security configuration.</span>
          </label>
          {error ? <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg border border-[#fb7185]/20 bg-[#fb7185]/[0.07] px-4 py-3 text-sm text-[#fda4af]"><AlertTriangle className="size-4 shrink-0" />{error}</div> : null}
        </form>
      </section>

      {loading ? <ScanningState target={target} /> : report ? <ReportView report={report} /> : <EmptyReport />}

      <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0b1915]/80">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3"><History className="size-4 text-[#5ee9ae]" /><h2 className="font-medium text-white">Recent scans</h2></div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#668177]">this browser · last 12</span>
        </div>
        {history.length ? (
          <div className="divide-y divide-white/[0.06]">
            {history.map((item) => (
              <button key={item.id} onClick={() => void openReport(item.id)} className="grid w-full grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-white/[0.025] sm:grid-cols-[1fr_90px_100px_24px] sm:px-6">
                <div><p className="font-mono text-sm text-white">{item.hostname}</p><p className="mt-1 text-xs text-[#668177]">{formatDate(item.scannedAt)}</p></div>
                <span className="hidden text-center font-mono text-sm text-[#9bb5aa] sm:block">{item.score}/100</span>
                <GradeBadge grade={item.grade} />
                <ChevronRight className="size-4 text-[#456056]" />
              </button>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center"><Clock3 className="mx-auto size-5 text-[#456056]" /><p className="mt-3 text-sm text-[#668177]">Scans started in this browser will appear here.</p></div>
        )}
      </section>
    </div>
  );
}

function ReportView({ report }: { report: ScanReport }) {
  const failed = useMemo(() => report.findings.filter((finding) => finding.status === "fail" || finding.status === "warn"), [report]);
  const scoreColor = report.score >= 80 ? "#5ee9ae" : report.score >= 60 ? "#f7c85b" : "#fb7185";
  const scoreStyle = { "--score": report.score, "--score-color": scoreColor } as CSSProperties;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1915]">
      <div className="grid gap-6 border-b border-white/[0.07] p-5 sm:p-7 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="score-ring relative grid size-28 place-items-center rounded-full" style={scoreStyle}>
          <div className="relative z-10 text-center"><strong className="block text-3xl text-white">{report.score}</strong><span className="font-mono text-[9px] uppercase tracking-widest text-[#668177]">out of 100</span></div>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3"><h2 className="font-mono text-xl font-medium text-white">{report.hostname}</h2><GradeBadge grade={report.grade} /></div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9bb5aa]">{report.summary}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#526d62]">Scanned {formatDate(report.scannedAt)} · policy v{report.policyVersion}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-[#07110f]/60 px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#668177]">Action queue</p><p className="mt-1 text-2xl font-semibold text-white">{failed.length}</p><p className="text-xs text-[#78978b]">items to review</p></div>
      </div>
      <Tabs defaultValue="findings" className="p-5 sm:p-7">
        <TabsList variant="line" className="mb-5 border-b border-white/[0.08]"><TabsTrigger value="findings" className="px-4 pb-3">Findings</TabsTrigger><TabsTrigger value="endpoints" className="px-4 pb-3">Web endpoints</TabsTrigger><TabsTrigger value="scope" className="px-4 pb-3">Scope</TabsTrigger></TabsList>
        <TabsContent value="findings"><div className="space-y-3">{report.findings.map((finding) => <FindingRow key={finding.id} finding={finding} />)}</div></TabsContent>
        <TabsContent value="endpoints">
          <div className="grid gap-3 sm:grid-cols-2">
            {report.endpoints.map((endpoint) => (
              <div key={`${endpoint.scheme}-${endpoint.port}`} className="rounded-xl border border-white/[0.07] bg-[#07110f]/60 p-4">
                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Server className="size-4 text-[#78978b]" /><span className="font-mono text-sm text-white">{endpoint.scheme.toUpperCase()} :{endpoint.port}</span></div><Badge className={endpoint.reachable ? "border-[#5ee9ae]/20 bg-[#5ee9ae]/10 text-[#5ee9ae]" : "border-white/10 bg-white/[0.04] text-[#668177]"}>{endpoint.reachable ? `HTTP ${endpoint.status}` : "No response"}</Badge></div>
                <p className="mt-3 text-xs leading-5 text-[#668177]">{endpoint.note}</p>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="scope">
          <div className="rounded-xl border border-[#63a8ff]/15 bg-[#63a8ff]/[0.05] p-5"><div className="flex gap-3"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-[#79b7ff]" /><div><h3 className="text-sm font-medium text-white">Safe, bounded assessment</h3><p className="mt-2 text-sm leading-6 text-[#8eaaa0]">{report.disclaimer} Private and reserved networks are blocked, redirects are constrained, and each anonymous browser and target is rate-limited.</p></div></div></div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const pass = finding.status === "pass";
  const informational = finding.status === "info";
  const icon = pass ? <Check className="size-4" /> : finding.severity === "high" ? <ShieldAlert className="size-4" /> : <AlertTriangle className="size-4" />;
  const tone = pass ? "bg-[#5ee9ae]/10 text-[#5ee9ae]" : informational ? "bg-[#63a8ff]/10 text-[#79b7ff]" : finding.severity === "high" ? "bg-[#fb7185]/10 text-[#fb7185]" : "bg-[#f7c85b]/10 text-[#f7c85b]";
  return (
    <article className="grid gap-4 rounded-xl border border-white/[0.07] bg-[#07110f]/55 p-4 sm:grid-cols-[36px_1fr_auto] sm:items-start">
      <div className={`grid size-9 place-items-center rounded-lg ${tone}`}>{icon}</div>
      <div>
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-white">{finding.title}</h3><span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#526d62]">{finding.category}</span></div>
        <p className="mt-2 font-mono text-[11px] leading-5 text-[#78978b]">{finding.evidence}</p>
        {!pass ? <p className="mt-2 text-xs leading-5 text-[#9bb5aa]">{finding.recommendation}</p> : null}
      </div>
      <span className={`font-mono text-[10px] uppercase tracking-wider ${pass ? "text-[#5ee9ae]" : informational ? "text-[#79b7ff]" : "text-[#f7c85b]"}`}>{pass ? "Pass" : informational ? "Info" : finding.severity}</span>
    </article>
  );
}

function ScanningState({ target }: { target: string }) {
  return <section className="mt-8 rounded-2xl border border-white/[0.08] bg-[#0b1915] p-7"><div className="flex items-center gap-4"><div className="grid size-12 place-items-center rounded-xl bg-[#5ee9ae]/10 text-[#5ee9ae]"><LoaderCircle className="size-5 animate-spin" /></div><div className="flex-1"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-white">Inspecting {target}</p><span className="font-mono text-[10px] text-[#668177]">bounded checks</span></div><Progress value={62} className="mt-3 bg-[#193128] [&>div]:bg-[#5ee9ae]" /></div></div></section>;
}

function EmptyReport() {
  return <section className="mt-8 grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center"><div><ShieldCheck className="mx-auto size-8 text-[#456056]" /><h2 className="mt-4 text-base font-medium text-[#b9cec5]">Ready for your first target</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#668177]">Your report will show scored controls, response evidence, remediation guidance, and HTTP-compatible endpoint visibility.</p></div></section>;
}

function GradeBadge({ grade }: { grade: string }) {
  const tone = grade === "A" || grade === "B" ? "border-[#5ee9ae]/20 bg-[#5ee9ae]/10 text-[#5ee9ae]" : grade === "C" || grade === "D" ? "border-[#f7c85b]/20 bg-[#f7c85b]/10 text-[#f7c85b]" : "border-[#fb7185]/20 bg-[#fb7185]/10 text-[#fb7185]";
  return <Badge className={`${tone} justify-center font-mono`}>Grade {grade}</Badge>;
}

function formatDate(value: string) {
  try { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return value; }
}

function getOrCreateClientId() {
  const existing = window.localStorage.getItem(CLIENT_STORAGE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(CLIENT_STORAGE_KEY, created);
  return created;
}
