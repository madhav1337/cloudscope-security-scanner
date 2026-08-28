const HEADER_RULES = [
  {
    id: "content-security-policy",
    title: "Content Security Policy",
    header: "content-security-policy",
    points: 25,
    severity: "high",
    recommendation: "Define an enforced Content-Security-Policy and remove unsafe-inline or wildcard sources where possible.",
  },
  {
    id: "clickjacking-protection",
    title: "Clickjacking protection",
    header: "x-frame-options",
    alternate: "content-security-policy",
    alternateIncludes: "frame-ancestors",
    points: 10,
    severity: "medium",
    recommendation: "Set X-Frame-Options or an enforced CSP frame-ancestors directive.",
  },
  {
    id: "content-type-options",
    title: "MIME sniffing protection",
    header: "x-content-type-options",
    expected: "nosniff",
    points: 8,
    severity: "medium",
    recommendation: "Set X-Content-Type-Options: nosniff on all responses.",
  },
  {
    id: "referrer-policy",
    title: "Referrer Policy",
    header: "referrer-policy",
    points: 7,
    severity: "medium",
    recommendation: "Set a privacy-preserving Referrer-Policy such as strict-origin-when-cross-origin.",
  },
  {
    id: "permissions-policy",
    title: "Permissions Policy",
    header: "permissions-policy",
    points: 5,
    severity: "low",
    recommendation: "Disable browser capabilities the site does not use with Permissions-Policy.",
  },
];

function headerValue(headers, key) {
  return headers?.[key] ?? headers?.[key.toLowerCase()] ?? null;
}

export function analyzePosture(input) {
  const findings = [];
  const httpsReachable = Boolean(input.httpsReachable);
  const httpRedirectsToHttps = Boolean(input.httpRedirectsToHttps);
  const headers = input.headers ?? {};

  findings.push({
    id: "https",
    title: "HTTPS availability",
    category: "transport",
    severity: "high",
    status: httpsReachable ? "pass" : "fail",
    evidence: httpsReachable ? `HTTPS responded${input.httpsStatus ? ` with ${input.httpsStatus}` : ""}.` : "No valid HTTPS response was received.",
    recommendation: httpsReachable ? "Keep TLS configuration and certificates current." : "Serve the site over HTTPS with a valid public certificate.",
    points: httpsReachable ? 15 : 0,
    maxPoints: 15,
  });

  findings.push({
    id: "http-redirect",
    title: "HTTP to HTTPS redirect",
    category: "transport",
    severity: "medium",
    status: httpRedirectsToHttps ? "pass" : "warn",
    evidence: httpRedirectsToHttps ? "The HTTP endpoint redirects to HTTPS." : "An automatic HTTP-to-HTTPS redirect was not observed.",
    recommendation: httpRedirectsToHttps ? "Keep the redirect permanent and site-wide." : "Redirect every HTTP request to the equivalent HTTPS URL.",
    points: httpRedirectsToHttps ? 5 : 0,
    maxPoints: 5,
  });

  const hsts = headerValue(headers, "strict-transport-security");
  const strongHsts = Boolean(hsts && !/max-age\s*=\s*0(?:\D|$)/i.test(hsts));
  findings.push({
    id: "hsts",
    title: "HTTP Strict Transport Security",
    category: "transport",
    severity: "high",
    status: strongHsts ? "pass" : "fail",
    evidence: hsts ? `Strict-Transport-Security: ${hsts}` : "Strict-Transport-Security header is absent.",
    recommendation: strongHsts ? "Review max-age before considering preload." : "Add a positive Strict-Transport-Security max-age after HTTPS is reliable across all subdomains.",
    points: strongHsts ? 15 : 0,
    maxPoints: 15,
  });

  for (const rule of HEADER_RULES) {
    const direct = headerValue(headers, rule.header);
    const alternate = rule.alternate ? headerValue(headers, rule.alternate) : null;
    const present = Boolean(
      (direct && (!rule.expected || direct.toLowerCase().includes(rule.expected))) ||
      (alternate && rule.alternateIncludes && alternate.toLowerCase().includes(rule.alternateIncludes)),
    );
    findings.push({
      id: rule.id,
      title: rule.title,
      category: "headers",
      severity: rule.severity,
      status: present ? "pass" : "warn",
      evidence: present ? `${direct ? rule.header : rule.alternate} is present.` : `${rule.header} was not detected.`,
      recommendation: present ? "Keep this control covered by deployment tests." : rule.recommendation,
      points: present ? rule.points : 0,
      maxPoints: rule.points,
    });
  }

  for (const [id, title, header] of [
    ["server-disclosure", "Server signature disclosure", "server"],
    ["powered-by-disclosure", "Framework disclosure", "x-powered-by"],
  ]) {
    const value = headerValue(headers, header);
    findings.push({
      id,
      title,
      category: "privacy",
      severity: "info",
      status: value ? "info" : "pass",
      evidence: value ? `${header}: ${String(value).slice(0, 180)}` : `${header} is not exposed.`,
      recommendation: value ? `Consider removing or minimizing the ${header} response header.` : "No action needed.",
      points: 0,
      maxPoints: 0,
    });
  }

  const applicable = findings.filter((finding) => finding.maxPoints > 0);
  const earned = applicable.reduce((sum, finding) => sum + finding.points, 0);
  const maximum = applicable.reduce((sum, finding) => sum + finding.maxPoints, 0);
  const score = maximum ? Math.round((earned / maximum) * 100) : 0;
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  const actionCount = findings.filter((finding) => finding.status === "fail" || finding.status === "warn").length;
  return {
    score,
    grade,
    findings,
    summary: actionCount === 0 ? "Strong single-response web posture. Keep monitoring for configuration drift." : `${actionCount} improvement${actionCount === 1 ? "" : "s"} prioritized from the public response evidence.`,
  };
}
