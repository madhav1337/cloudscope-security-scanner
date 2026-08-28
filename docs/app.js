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
  setError("");
  setLoading(true);
  statePanel.hidden = false;
  statePanel.classList.add("loading-state");
  statePanel.innerHTML = `<span class="empty-shield" aria-hidden="true">⌁</span><h2>Inspecting ${escapeHtml(targetInput.value.trim())}</h2><p>Resolving public addresses and checking the bounded web endpoint set.</p>`;
  reportPanel.hidden = true;

  try {
    const data = await api("/api/scans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: targetInput.value.trim(), authorized: authorizedInput.checked }),
    });
    if (!data.report) throw new Error("The scan returned no report.");
    renderReport(data.report);
    await loadHistory();
  } catch (error) {
    setError(error instanceof Error ? error.message : "The scan could not be completed.");
    statePanel.hidden = true;
  } finally {
    statePanel.classList.remove("loading-state");
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
    historyPanel.innerHTML = `<div class="history-empty"><span aria-hidden="true">◷</span><p>Scans started in this browser will appear here.</p></div>`;
    return;
  }
  historyPanel.innerHTML = scans.map((item) => `
    <button class="history-item" type="button" data-report-id="${escapeHtml(item.id)}">
      <span><strong>${escapeHtml(item.hostname)}</strong><small>${escapeHtml(formatDate(item.scannedAt))}</small></span>
      <span class="history-score">${Number(item.score)}/100</span>
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
  const actionCount = report.findings.filter((finding) => finding.status === "fail" || finding.status === "warn").length;
  const scoreColor = report.score >= 80 ? "#5ee9ae" : report.score >= 60 ? "#f7c85b" : "#fb7185";
  reportPanel.innerHTML = `
    <div class="report-summary">
      <div class="score-ring" style="--score:${Number(report.score)};--score-color:${scoreColor}">
        <span><strong>${Number(report.score)}</strong><small>out of 100</small></span>
      </div>
      <div class="report-copy">
        <div class="report-title-row"><h2>${escapeHtml(report.hostname)}</h2><span class="grade ${gradeClass(report.grade)}">Grade ${escapeHtml(report.grade)}</span></div>
        <p>${escapeHtml(report.summary)}</p>
        <p class="report-meta">Scanned ${escapeHtml(formatDate(report.scannedAt))} · policy v${Number(report.policyVersion)}</p>
      </div>
      <div class="action-count"><small>Action queue</small><strong>${actionCount}</strong><span>items to review</span></div>
    </div>
    <div class="report-body">
      <section class="report-section">
        <h3>Findings</h3>
        <div class="findings">${report.findings.map(renderFinding).join("")}</div>
      </section>
      <aside class="report-section">
        <h3>Web endpoints</h3>
        <div class="endpoints">${report.endpoints.map(renderEndpoint).join("")}</div>
        <div class="scope-note"><strong>Safe, bounded assessment.</strong> ${escapeHtml(report.disclaimer)} Private and reserved networks are blocked, redirects are constrained, and each browser and target is rate-limited.</div>
      </aside>
    </div>
  `;
  statePanel.hidden = true;
  reportPanel.hidden = false;
}

function renderFinding(finding) {
  const icon = finding.status === "pass" ? "✓" : finding.status === "info" ? "i" : "!";
  const recommendation = finding.status === "pass" ? "" : `<p class="recommendation">${escapeHtml(finding.recommendation)}</p>`;
  return `
    <article class="finding ${escapeHtml(finding.status)} ${escapeHtml(finding.severity)}">
      <span class="finding-icon" aria-hidden="true">${icon}</span>
      <div><h4>${escapeHtml(finding.title)}</h4><span class="finding-category">${escapeHtml(finding.category)}</span><p>${escapeHtml(finding.evidence)}</p>${recommendation}</div>
      <span class="finding-status">${finding.status === "pass" ? "Pass" : finding.status === "info" ? "Info" : escapeHtml(finding.severity)}</span>
    </article>
  `;
}

function renderEndpoint(endpoint) {
  const status = endpoint.reachable ? `HTTP ${Number(endpoint.status)}` : "No response";
  return `
    <article class="endpoint">
      <header><strong>${escapeHtml(endpoint.scheme.toUpperCase())} :${Number(endpoint.port)}</strong><span class="endpoint-status ${endpoint.reachable ? "up" : ""}">${status}</span></header>
      <p>${escapeHtml(endpoint.note)}</p>
    </article>
  `;
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
  scanButton.querySelector("span:last-child").textContent = loading ? "Scanning" : "Run scan";
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
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}
