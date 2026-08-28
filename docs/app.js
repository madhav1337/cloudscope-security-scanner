const API_BASE = "https://cloudscope-scanner.zentex1337.chatgpt.site";
const CLIENT_STORAGE_KEY = "cloudscope-anonymous-client";

const form = document.querySelector("#scan-form");
const targetInput = document.querySelector("#target");
const authorizedInput = document.querySelector("#authorized");
const scanButton = document.querySelector("#scan-button");
const errorBox = document.querySelector("#error");
const statePanel = document.querySelector("#scan-state");
const reportPanel = document.querySelector("#report");
const historyPanel = document.querySelector("#history");
const clientId = getOrCreateClientId();

form.addEventListener("submit", runScan);
targetInput.addEventListener("input", updateButton);
authorizedInput.addEventListener("change", updateButton);
void loadHistory();

function updateButton() {
  scanButton.disabled = !targetInput.value.trim() || !authorizedInput.checked || scanButton.classList.contains("loading");
}

async function runScan(event) {
  event.preventDefault();
  const target = targetInput.value.trim();
  setError("");
  setLoading(true);
  statePanel.hidden = false;
  statePanel.className = "empty-state loading-state";
  statePanel.innerHTML = `
    <span class="loading-icon" aria-hidden="true">⌁</span>
    <div class="loading-copy">
      <h2>Mapping ${escapeHtml(target)}</h2>
      <p>Bounded checks in progress · TLS · headers · endpoints</p>
      <div class="loading-bar" aria-hidden="true"><i></i></div>
    </div>`;
  reportPanel.hidden = true;

  try {
    const data = await api("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, authorized: authorizedInput.checked }),
    });
    if (!data.report) throw new Error("The scan returned no report.");
    renderReport(data.report);
    await loadHistory();
    reportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setError(error instanceof Error ? error.message : "The scan could not be completed.");
    statePanel.hidden = true;
  } finally {
    setLoading(false);
  }
}

async function loadHistory() {
  try {
    const data = await api("/api/scans", { cache: "no-store" });
    renderHistory(data.scans || []);
  } catch {
    historyPanel.innerHTML = `<div class="history-empty"><span aria-hidden="true">◷</span><p>History is temporarily unavailable. You can still start a new scan.</p></div>`;
  }
}

function renderHistory(scans) {
  if (!scans.length) {
    historyPanel.innerHTML = `<div class="history-empty"><span aria-hidden="true">◷</span><p>Your scan history will appear here.</p></div>`;
    return;
  }

  historyPanel.innerHTML = scans.map((item) => `
    <button class="history-item" type="button" data-report-id="${escapeHtml(item.id)}">
      <span><strong>${escapeHtml(item.hostname)}</strong><small>${escapeHtml(formatDate(item.scannedAt))}</small></span>
      <span class="history-score">${Number(item.score)}<small>/100</small></span>
      <span class="grade ${gradeClass(item.grade)}">Grade ${escapeHtml(item.grade)}</span>
      <span class="history-arrow" aria-hidden="true">›</span>
    </button>
  `).join("");

  historyPanel.querySelectorAll("[data-report-id]").forEach((button) => {
    button.addEventListener("click", () => void openReport(button.dataset.reportId));
  });
}

async function openReport(id) {
  setError("");
  try {
    const data = await api(`/api/scans/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!data.report) throw new Error("Report unavailable.");
    renderReport(data.report);
    reportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setError(error instanceof Error ? error.message : "Report unavailable.");
  }
}

function renderReport(report) {
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const endpoints = Array.isArray(report.endpoints) ? report.endpoints : [];
  const actionCount = findings.filter((finding) => finding.status === "fail" || finding.status === "warn").length;
  const passedCount = findings.filter((finding) => finding.status === "pass").length;
  const score = Math.max(0, Math.min(100, Number(report.score) || 0));
  const scoreTone = score >= 80 ? "score-good" : score >= 60 ? "score-warn" : "score-bad";

  reportPanel.innerHTML = `
    <div class="report-summary">
      <div class="score-ring ${scoreTone}">
        <svg class="score-meter" viewBox="0 0 44 44" aria-hidden="true">
          <circle class="track" cx="22" cy="22" r="18" pathLength="100"></circle>
          <circle class="progress" cx="22" cy="22" r="18" pathLength="100" stroke-dasharray="${score} 100"></circle>
        </svg>
        <span class="score-copy"><strong>${score}</strong><small>out of 100</small></span>
      </div>
      <div class="report-copy">
        <p class="report-kicker">SECURITY SNAPSHOT</p>
        <div class="report-title-row"><h2>${escapeHtml(report.hostname)}</h2><span class="grade ${gradeClass(report.grade)}">Grade ${escapeHtml(report.grade)}</span></div>
        <p>${escapeHtml(report.summary)}</p>
        <p class="report-meta">Scanned ${escapeHtml(formatDate(report.scannedAt))} · policy v${Number(report.policyVersion)}</p>
      </div>
      <div class="report-stats">
        <div class="report-stat review"><small>To review</small><strong>${actionCount}</strong></div>
        <div class="report-stat passed"><small>Passed</small><strong>${passedCount}</strong></div>
      </div>
    </div>
    <div class="report-tabs" role="tablist" aria-label="Report sections">
      <button id="findings-tab" type="button" role="tab" aria-selected="true" aria-controls="findings-panel" data-tab="findings-panel">Findings</button>
      <button id="endpoints-tab" type="button" role="tab" aria-selected="false" aria-controls="endpoints-panel" data-tab="endpoints-panel">Web endpoints</button>
      <button id="scope-tab" type="button" role="tab" aria-selected="false" aria-controls="scope-panel" data-tab="scope-panel">Scan scope</button>
    </div>
    <div class="report-body">
      <section id="findings-panel" class="tab-panel" role="tabpanel" aria-labelledby="findings-tab">
        <div class="findings">${findings.map(renderFinding).join("")}</div>
      </section>
      <section id="endpoints-panel" class="tab-panel" role="tabpanel" aria-labelledby="endpoints-tab" hidden>
        <div class="endpoints">${endpoints.map(renderEndpoint).join("")}</div>
      </section>
      <section id="scope-panel" class="tab-panel" role="tabpanel" aria-labelledby="scope-tab" hidden>
        <div class="scope-note"><strong>Safe, bounded assessment</strong>${escapeHtml(report.disclaimer)} Private and reserved networks are blocked, redirects are constrained, and each anonymous browser and target is rate-limited.</div>
      </section>
    </div>`;

  reportPanel.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => selectReportTab(button));
  });
  statePanel.hidden = true;
  reportPanel.hidden = false;
}

function selectReportTab(selectedButton) {
  reportPanel.querySelectorAll("[data-tab]").forEach((button) => {
    button.setAttribute("aria-selected", String(button === selectedButton));
  });
  reportPanel.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.hidden = panel.id !== selectedButton.dataset.tab;
  });
}

function renderFinding(finding) {
  const status = ["pass", "info", "warn", "fail"].includes(finding.status) ? finding.status : "info";
  const severity = ["high", "medium", "low", "info"].includes(finding.severity) ? finding.severity : "info";
  const icon = status === "pass" ? "✓" : status === "info" ? "i" : "!";
  const label = status === "pass" ? "Pass" : status === "info" ? "Info" : severity;
  const recommendation = status === "pass" ? "" : `<p class="recommendation">${escapeHtml(finding.recommendation)}</p>`;

  return `
    <article class="finding ${status} ${severity}">
      <span class="finding-icon" aria-hidden="true">${icon}</span>
      <div><h4>${escapeHtml(finding.title)}</h4><span class="finding-category">${escapeHtml(finding.category)}</span><p>${escapeHtml(finding.evidence)}</p>${recommendation}</div>
      <span class="finding-status">${escapeHtml(label)}</span>
    </article>`;
}

function renderEndpoint(endpoint) {
  const status = endpoint.reachable ? `HTTP ${Number(endpoint.status)}` : "No response";
  return `
    <article class="endpoint">
      <header><strong>${escapeHtml(String(endpoint.scheme).toUpperCase())} :${Number(endpoint.port)}</strong><span class="endpoint-status ${endpoint.reachable ? "up" : ""}">${status}</span></header>
      <p>${escapeHtml(endpoint.note)}</p>
    </article>`;
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("X-CloudScope-Client", clientId);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "CloudScope is temporarily unavailable.");
  return data;
}

function setLoading(loading) {
  scanButton.classList.toggle("loading", loading);
  scanButton.querySelector("span:nth-child(2)").textContent = loading ? "Scanning" : "Run scan";
  scanButton.disabled = loading || !targetInput.value.trim() || !authorizedInput.checked;
}

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function getOrCreateClientId() {
  try {
    const existing = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(CLIENT_STORAGE_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function gradeClass(grade) {
  return grade === "A" || grade === "B" ? "grade-good" : grade === "C" || grade === "D" ? "grade-warn" : "grade-bad";
}

function formatDate(value) {
  try { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return String(value); }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
