"use client";

import type { CSSProperties, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Globe2,
  History,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Radar,
  ScanLine,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
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
      window.setTimeout(() => document.getElementById("scan-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
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
      window.setTimeout(() => document.getElementById("scan-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Report unavailable.");
    }
  }

  return (
    <div className="pb-14 pt-8 sm:pt-12 lg:pt-16">
      <div className="sr-only" aria-live="polite">
        {loading ? `Scanning ${target}` : error ? error : report ? `Scan complete. ${report.hostname} scored ${report.score} out of 100.` : ""}
      </div>

      <section className="grid items-center gap-8 xl:grid-cols-[minmax(0,.92fr)_minmax(520px,1.08fr)] xl:gap-14">
        <div className="relative z-10 py-2 sm:py-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#59e1ff]/15 bg-[#59e1ff]/[0.055] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#80e9ff]">
            <Sparkles className="size-3.5" />
            Security posture intelligence
          </div>

          <h1 className="hero-title mt-6 text-white">
            See your <span className="text-gradient">exposure.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-7 text-[#a4b1c6] sm:text-base lg:text-lg lg:leading-8">
            Turn a public domain into a clear security snapshot—TLS, headers, leakage, and endpoint signals translated into fixes you can actually ship.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <SignalPill icon={<ShieldCheck className="size-3.5" />} label="Passive checks" />
            <SignalPill icon={<KeyRound className="size-3.5" />} label="No credentials" />
            <SignalPill icon={<Activity className="size-3.5" />} label="Live scoring" />
          </div>
        </div>

        <section className="scope-panel relative overflow-hidden rounded-[1.6rem] border border-[#59e1ff]/15 p-4 sm:p-6 lg:p-7" aria-labelledby="scan-title">
          <div className="panel-grid pointer-events-none absolute inset-0 opacity-65" />
          <div className="pointer-events-none absolute -right-5 -top-8 opacity-60 sm:right-5 sm:top-2">
            <div className="scope-radar" aria-hidden="true"><i className="scope-node" /><i className="scope-node" /><i className="scope-node" /></div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg border border-[#45d89b]/20 bg-[#45d89b]/10 text-[#65e2ac]">
                  <ScanLine className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">Live scanner</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6f7f98]">engine ready</p>
                </div>
              </div>
              <span className="mr-20 hidden rounded-md border border-white/[0.07] bg-black/15 px-2 py-1 font-mono text-[9px] text-[#71829c] sm:inline-flex">CS-NODE 01</span>
            </div>

            <div className="mt-7 max-w-[34rem]">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8e9db2]">New assessment</p>
              <h2 id="scan-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-[1.75rem]">Scan a public domain</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-[#8998ae]">One domain, one bounded scan. No paths, private IPs, credentials, or custom ports.</p>
            </div>

            <form onSubmit={submit} className="mt-7">
              <label htmlFor="scan-target" className="mb-2 block text-xs font-semibold text-[#bdc8d8]">Domain</label>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="group relative">
                  <Globe2 className="absolute left-4 top-1/2 z-10 size-[18px] -translate-y-1/2 text-[#71819a] transition-colors group-focus-within:text-[#59e1ff]" />
                  <Input
                    id="scan-target"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    placeholder="yourdomain.com"
                    autoComplete="url"
                    inputMode="url"
                    spellCheck={false}
                    className="h-14 rounded-xl border-white/[0.10] bg-[#070b14]/80 pl-12 pr-4 font-mono text-[15px] text-white shadow-inner shadow-black/20 placeholder:text-[#4f5e75] focus-visible:border-[#59e1ff]/40 focus-visible:ring-[#59e1ff]/30"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !target.trim() || !authorized}
                  className="scan-button h-14 min-w-40 rounded-xl border-0 px-6 font-semibold text-[#06131a] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-40 sm:px-7"
                >
                  {loading ? <><LoaderCircle className="animate-spin" /> Scanning</> : <><Radar /> Run scan <ArrowRight className="size-4" /></>}
                </Button>
              </div>

              <label className="mt-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border border-white/[0.065] bg-white/[0.025] p-3 text-xs leading-5 text-[#98a6ba] transition hover:border-white/[0.11] hover:bg-white/[0.04]">
                <Checkbox
                  checked={authorized}
                  onCheckedChange={(value) => setAuthorized(value === true)}
                  className="mt-0.5 border-[#53647e] data-[state=checked]:border-[#59e1ff] data-[state=checked]:bg-[#59e1ff] data-[state=checked]:text-[#07101a]"
                />
                <span>I own this domain or have explicit authorization to assess its public security configuration.</span>
              </label>

              {error ? (
                <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-[#ff7185]/25 bg-[#ff7185]/[0.075] px-4 py-3.5 text-sm leading-6 text-[#ff9bab]">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 break-words">{error}</span>
                </div>
              ) : null}
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] uppercase tracking-[0.13em] text-[#65758e]">
              <span className="flex items-center gap-1.5"><LockKeyhole className="size-3" /> no account</span>
              <span className="flex items-center gap-1.5"><Zap className="size-3" /> rate limited</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3" /> private networks blocked</span>
            </div>
          </div>
        </section>
      </section>

      <section className="mt-7 grid gap-3 md:grid-cols-3" aria-label="Scanner capabilities">
        <MetricCard icon={<LockKeyhole />} eyebrow="Access" value="Zero sign-in" copy="Open the app and scan—anonymous by default." tone="cyan" />
        <MetricCard icon={<ScanLine />} eyebrow="Coverage" value="TLS + web signals" copy="Headers, leakage, and common endpoints in one pass." tone="violet" />
        <MetricCard icon={<ShieldCheck />} eyebrow="Output" value="Action-ready" copy="Evidence and prioritized remediation, not vague alerts." tone="green" />
      </section>

      <div id="scan-results" className="scroll-mt-28">
        {loading ? <ScanningState target={target} /> : report ? <ReportView report={report} /> : <EmptyReport />}
      </div>

      <section className="history-shell mt-7 overflow-hidden rounded-[1.35rem] border border-white/[0.075] bg-[#0c1323]/88">
        <div className="flex flex-col gap-2 border-b border-white/[0.065] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-[#a99bff]/18 bg-[#a99bff]/10 text-[#b8adff]"><History className="size-4" /></span>
            <div><h2 className="text-sm font-semibold text-white">Recent scans</h2><p className="mt-0.5 text-xs text-[#718199]">Reopen reports from this device</p></div>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#687890]">browser local · last 12</span>
        </div>

        {history.length ? (
          <div className="divide-y divide-white/[0.055]">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => void openReport(item.id)}
                className="group grid min-h-[72px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 text-left transition duration-200 hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#59e1ff] sm:grid-cols-[minmax(0,1fr)_100px_110px_24px] sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium text-white transition-colors group-hover:text-[#80e9ff]">{item.hostname}</p>
                  <p className="mt-1 text-[11px] text-[#718199]">{formatDate(item.scannedAt)}</p>
                </div>
                <span className="hidden text-center font-mono text-sm text-[#a5b1c3] sm:block">{item.score}<span className="text-[#56667f]">/100</span></span>
                <GradeBadge grade={item.grade} />
                <ChevronRight className="hidden size-4 text-[#53627a] transition-transform group-hover:translate-x-0.5 group-hover:text-[#80e9ff] sm:block" />
              </button>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Clock3 className="mx-auto size-5 text-[#53627a]" />
            <p className="mt-3 text-sm text-[#77879f]">Your scan history will appear here.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SignalPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/[0.075] bg-white/[0.03] px-3 text-xs font-medium text-[#aeb9ca]">{icon}{label}</span>;
}

function MetricCard({ icon, eyebrow, value, copy, tone }: { icon: React.ReactNode; eyebrow: string; value: string; copy: string; tone: "cyan" | "violet" | "green" }) {
  const colors = tone === "cyan" ? "border-[#59e1ff]/15 bg-[#59e1ff]/[0.07] text-[#80e9ff]" : tone === "violet" ? "border-[#a99bff]/15 bg-[#a99bff]/[0.07] text-[#bcb1ff]" : "border-[#45d89b]/15 bg-[#45d89b]/[0.07] text-[#65e2ac]";
  return (
    <article className="metric-card flex min-h-32 gap-4 rounded-2xl border border-white/[0.07] bg-[#0c1323]/82 p-4 sm:p-5">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl border [&>svg]:size-[18px] ${colors}`}>{icon}</span>
      <div>
        <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[#687890]">{eyebrow}</p>
        <h2 className="mt-1.5 text-sm font-semibold text-white sm:text-base">{value}</h2>
        <p className="mt-1.5 text-xs leading-5 text-[#7f8fa6]">{copy}</p>
      </div>
    </article>
  );
}

function ReportView({ report }: { report: ScanReport }) {
  const failed = useMemo(() => report.findings.filter((finding) => finding.status === "fail" || finding.status === "warn"), [report]);
  const passed = useMemo(() => report.findings.filter((finding) => finding.status === "pass").length, [report]);
  const scoreColor = report.score >= 80 ? "#45d89b" : report.score >= 60 ? "#ffd166" : "#ff7185";
  const scoreStyle = { "--score": report.score, "--score-color": scoreColor } as CSSProperties;

  return (
    <section className="report-shell mt-7 overflow-hidden rounded-[1.5rem] border border-white/[0.075] bg-[#0c1323]/95">
      <div className="grid gap-7 border-b border-white/[0.065] p-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="score-ring relative grid size-28 place-items-center rounded-full sm:size-32" style={scoreStyle}>
          <div className="relative z-10 text-center">
            <strong className="block text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">{report.score}</strong>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#74849c]">out of 100</span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6f8099]">Security snapshot</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="min-w-0 break-all font-mono text-xl font-semibold text-white sm:text-2xl">{report.hostname}</h2>
            <GradeBadge grade={report.grade} />
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a4b1c6]">{report.summary}</p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#64748c]">Scanned {formatDate(report.scannedAt)} · policy v{report.policyVersion}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:w-48 lg:grid-cols-1">
          <div className="rounded-xl border border-[#ff7185]/14 bg-[#ff7185]/[0.055] px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9b8291]">To review</p>
            <p className="mt-1 text-2xl font-semibold text-white">{failed.length}</p>
          </div>
          <div className="rounded-xl border border-[#45d89b]/14 bg-[#45d89b]/[0.05] px-4 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6e9687]">Passed</p>
            <p className="mt-1 text-2xl font-semibold text-white">{passed}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="findings" className="p-4 sm:p-7">
        <div className="overflow-x-auto border-b border-white/[0.07]">
          <TabsList variant="line" className="mb-0 min-w-max bg-transparent">
            <TabsTrigger value="findings" className="min-h-11 px-4 pb-3 text-xs data-[state=active]:text-[#80e9ff] sm:text-sm">Findings</TabsTrigger>
            <TabsTrigger value="endpoints" className="min-h-11 px-4 pb-3 text-xs data-[state=active]:text-[#80e9ff] sm:text-sm">Web endpoints</TabsTrigger>
            <TabsTrigger value="scope" className="min-h-11 px-4 pb-3 text-xs data-[state=active]:text-[#80e9ff] sm:text-sm">Scan scope</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="findings" className="mt-5">
          <div className="space-y-3">{report.findings.map((finding) => <FindingRow key={finding.id} finding={finding} />)}</div>
        </TabsContent>

        <TabsContent value="endpoints" className="mt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {report.endpoints.map((endpoint) => (
              <article key={`${endpoint.scheme}-${endpoint.port}`} className="rounded-xl border border-white/[0.075] bg-[#080e1a]/72 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5"><Server className="size-4 text-[#7e8ea6]" /><span className="font-mono text-sm font-medium text-white">{endpoint.scheme.toUpperCase()} :{endpoint.port}</span></div>
                  <Badge className={endpoint.reachable ? "border-[#45d89b]/20 bg-[#45d89b]/10 text-[#65e2ac]" : "border-white/10 bg-white/[0.04] text-[#7b8aa1]"}>{endpoint.reachable ? `HTTP ${endpoint.status}` : "No response"}</Badge>
                </div>
                <p className="mt-3 text-xs leading-5 text-[#77879f]">{endpoint.note}</p>
              </article>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scope" className="mt-5">
          <div className="rounded-xl border border-[#59e1ff]/14 bg-[#59e1ff]/[0.045] p-5">
            <div className="flex gap-3.5">
              <LockKeyhole className="mt-0.5 size-[18px] shrink-0 text-[#80e9ff]" />
              <div><h3 className="text-sm font-semibold text-white">Safe, bounded assessment</h3><p className="mt-2 text-sm leading-6 text-[#95a4b9]">{report.disclaimer} Private and reserved networks are blocked, redirects are constrained, and each anonymous browser and target is rate-limited.</p></div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function FindingRow({ finding }: { finding: Finding }) {
  const pass = finding.status === "pass";
  const informational = finding.status === "info";
  const icon = pass ? <Check className="size-4" /> : finding.severity === "high" ? <ShieldAlert className="size-4" /> : <AlertTriangle className="size-4" />;
  const color = pass ? "#45d89b" : informational ? "#59e1ff" : finding.severity === "high" ? "#ff7185" : "#ffd166";
  const tone = pass ? "border-[#45d89b]/15 bg-[#45d89b]/[0.07] text-[#65e2ac]" : informational ? "border-[#59e1ff]/15 bg-[#59e1ff]/[0.07] text-[#80e9ff]" : finding.severity === "high" ? "border-[#ff7185]/15 bg-[#ff7185]/[0.07] text-[#ff93a4]" : "border-[#ffd166]/15 bg-[#ffd166]/[0.07] text-[#ffdc84]";
  const style = { "--finding-color": color } as CSSProperties;

  return (
    <article className="finding-card grid gap-4 rounded-xl border border-white/[0.07] bg-[#080e1a]/72 p-4 pl-[18px] sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-start sm:p-5 sm:pl-[22px]" style={style}>
      <div className={`grid size-10 place-items-center rounded-xl border ${tone}`}>{icon}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-sm font-semibold text-white">{finding.title}</h3>
          <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#66768f]">{finding.category}</span>
        </div>
        <p className="mt-2 break-words font-mono text-[11px] leading-5 text-[#8291a7]">{finding.evidence}</p>
        {!pass ? <p className="mt-2.5 text-xs leading-5 text-[#a5b1c3]">{finding.recommendation}</p> : null}
      </div>
      <span className={`w-fit rounded-md border px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.11em] ${tone}`}>{pass ? "Pass" : informational ? "Info" : finding.severity}</span>
    </article>
  );
}

function ScanningState({ target }: { target: string }) {
  return (
    <section className="scan-sweep report-shell mt-7 overflow-hidden rounded-[1.35rem] border border-[#59e1ff]/15 bg-[#0c1323] p-5 sm:p-7">
      <div className="relative z-10 flex items-center gap-4 sm:gap-5">
        <div className="soft-pulse grid size-12 shrink-0 place-items-center rounded-xl border border-[#59e1ff]/20 bg-[#59e1ff]/10 text-[#80e9ff] sm:size-14"><Radar className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p className="truncate text-sm font-semibold text-white">Mapping {target}</p>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#718199]">bounded checks in progress</span>
          </div>
          <Progress value={62} className="mt-3 h-1.5 bg-[#1b2940] [&>div]:bg-gradient-to-r [&>div]:from-[#59e1ff] [&>div]:to-[#a99bff]" />
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.11em] text-[#64748c]"><span>TLS handshake</span><span>Headers</span><span>Endpoints</span></div>
        </div>
      </div>
    </section>
  );
}

function EmptyReport() {
  const checks = ["TLS posture", "Security headers", "Info leakage", "Web endpoints"];
  return (
    <section className="report-shell mt-7 overflow-hidden rounded-[1.35rem] border border-white/[0.07] bg-[#0c1323]/72">
      <div className="grid min-h-72 gap-6 p-5 sm:p-7 md:grid-cols-[minmax(0,1fr)_minmax(280px,.8fr)] md:items-center">
        <div>
          <span className="inline-flex size-11 items-center justify-center rounded-xl border border-[#a99bff]/18 bg-[#a99bff]/10 text-[#bcb1ff]"><ShieldCheck className="size-5" /></span>
          <p className="mt-5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#6c7c94]">Report workspace</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">Ready when your domain is.</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#8190a7]">Run a scan to unlock a scored report with raw evidence, prioritized findings, and practical remediation.</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {checks.map((check, index) => (
            <div key={check} className="rounded-xl border border-white/[0.065] bg-[#080e1a]/75 p-3.5 sm:p-4">
              <div className="flex items-center justify-between"><span className="font-mono text-[9px] text-[#576881]">0{index + 1}</span><span className="size-1.5 rounded-full bg-[#34445e]" /></div>
              <p className="mt-6 text-xs font-medium text-[#a4b1c6]">{check}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const tone = grade === "A" || grade === "B" ? "border-[#45d89b]/20 bg-[#45d89b]/10 text-[#65e2ac]" : grade === "C" || grade === "D" ? "border-[#ffd166]/20 bg-[#ffd166]/10 text-[#ffdc84]" : "border-[#ff7185]/20 bg-[#ff7185]/10 text-[#ff93a4]";
  return <Badge className={`${tone} min-w-[74px] justify-center font-mono text-[10px]`}>Grade {grade}</Badge>;
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
