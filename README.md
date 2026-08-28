# CloudScope Security Scanner

CloudScope is a safe, portfolio-ready web security posture scanner. It checks a public domain's HTTPS enforcement, browser security headers, information-disclosure headers, and HTTP-compatible responses on four common web endpoints. Reports are scored, stored per signed-in user, and paired with concrete remediation guidance.

> CloudScope is intentionally not a vulnerability scanner or raw TCP port scanner. It performs bounded HTTP requests only, blocks private and reserved destinations, constrains redirects, requires authorization confirmation, and rate-limits each account.

## Features

- ChatGPT sign-in and user-owned scan history
- HTTPS, redirect, HSTS, CSP, clickjacking, MIME-sniffing, referrer and permissions-policy checks
- Informational server and framework disclosure checks
- Bounded HTTP-compatible endpoint checks on 80, 443, 8080 and 8443
- SSRF defenses using strict hostname validation, public DNS resolution and redirect validation
- D1-backed reports, score-policy versioning and hourly per-user rate limiting
- Responsive dashboard, evidence view and remediation queue
- Unit tests, GitHub Actions and container setup

## Architecture

- **Frontend:** React, Vinext, Tailwind CSS and the vendored Shadcn component catalog
- **Backend:** Cloudflare-compatible server routes
- **Database:** Cloudflare D1 with Drizzle-managed migrations
- **Identity:** platform-managed Sign in with ChatGPT

## Local development

```sh
npm ci
npm run db:generate
npm run dev
```

The hosted environment supplies authentication and the `DB` binding. Local scanner UI work can run without those platform capabilities; authenticated API routes require the Sites runtime.

## Quality checks

```sh
npm run lint
npm test
```

`npm test` creates a production build before executing the posture-scoring and target-validation regression suites.

## Responsible use

Only scan domains you own or have explicit authorization to assess. Results describe observable HTTP configuration and should be confirmed manually before changing production infrastructure. A passing report does not prove that a site is free of vulnerabilities.

## Deployment

This repository is configured for OpenAI Sites. The hosting manifest requests one logical D1 binding named `DB`; generated migrations are applied during deployment.
