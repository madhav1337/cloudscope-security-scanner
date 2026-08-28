# CloudScope Security Scanner

[![Live demo](https://img.shields.io/badge/live_demo-GitHub_Pages-5ee9ae?style=for-the-badge&logo=github)](https://madhav1337.github.io/cloudscope-security-scanner/)
[![CI](https://github.com/madhav1337/cloudscope-security-scanner/actions/workflows/ci.yml/badge.svg)](https://github.com/madhav1337/cloudscope-security-scanner/actions/workflows/ci.yml)

**Public app:** [madhav1337.github.io/cloudscope-security-scanner](https://madhav1337.github.io/cloudscope-security-scanner/) — no ChatGPT account or sign-in required.

CloudScope is a safe, portfolio-ready web security posture scanner. It checks a public domain's HTTPS enforcement, browser security headers, information-disclosure headers, and HTTP-compatible responses on four common web endpoints. Reports are scored, stored for an anonymous browser session, and paired with concrete remediation guidance.

> CloudScope is intentionally not a vulnerability scanner or raw TCP port scanner. It performs bounded HTTP requests only, blocks private and reserved destinations, constrains redirects, requires authorization confirmation, and applies per-browser, per-target, and global rate limits.

## Features

- Public GitHub Pages interface with no account requirement
- Anonymous browser-specific report history backed by D1; raw browser identifiers are not stored
- HTTPS, redirect, HSTS, CSP, clickjacking, MIME-sniffing, referrer and permissions-policy checks
- Informational server and framework disclosure checks
- Bounded HTTP-compatible endpoint checks on 80, 443, 8080 and 8443
- SSRF defenses using strict hostname validation, public DNS resolution and redirect validation
- Layered rate limiting for anonymous clients, target domains, and overall service capacity
- Responsive dashboard, evidence view and remediation queue
- Unit tests, GitHub Actions, GitHub Pages deployment and container setup

## Architecture

- **Public frontend:** static HTML, CSS and JavaScript deployed on GitHub Pages from `docs/`
- **Scanner service:** Cloudflare-compatible Vinext server routes deployed as a public OpenAI Site
- **Database:** Cloudflare D1 with Drizzle-managed migrations
- **Anonymous identity:** a random browser UUID is sent to the service and stored only as a SHA-256-derived owner key
- **Source app:** React, Vinext, Tailwind CSS and the vendored Shadcn component catalog

The scanner API accepts browser requests only from the GitHub Pages origin and the public Site origin. Reports can be reopened only by the anonymous browser that created them.

## Local development

```sh
npm ci
npm run db:generate
npm run dev
```

The hosted environment supplies the `DB` binding. The static GitHub Pages client in `docs/` calls the deployed scanner service.

## Quality checks

```sh
npm run lint
npm test
```

`npm test` creates a production build before executing posture-scoring, target-validation, and public API boundary regression suites.

## Responsible use

Only scan domains you own or have explicit authorization to assess. Results describe observable HTTP configuration and should be confirmed manually before changing production infrastructure. A passing report does not prove that a site is free of vulnerabilities.

## Deployment

- `.github/workflows/pages.yml` publishes `docs/` to GitHub Pages.
- `.openai/hosting.json` configures the scanner service and its logical D1 binding named `DB`; generated migrations are applied during service deployment.
