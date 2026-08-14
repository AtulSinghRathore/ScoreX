# ScoreX

ScoreX is a modular TypeScript web application for real live-sports scores, local user/admin accounts, and **ScoreX Coin (SXC)** predictions.

## Architecture

```text
src/
├── app/                    Application orchestration and event handling
├── config/                 Runtime constants and default data
├── domain/                 Types, provider mapping, selectors, market rules
├── features/
│   ├── admin/              Admin account and market-control logic
│   ├── auth/               Local login, registration and admin-ID association
│   ├── demo/               Accessible guided product tour
│   ├── live/               Provider refresh/rate-limit policy
│   ├── predictions/        Selection, multiplier, and return logic
│   └── wallet/             SXC ledger, top-up requests and QR generation
├── services/               SportScore client and browser persistence
├── shared/                 Formatting, hashing, and output safety helpers
├── state/                  Initial state construction
├── styles/                 Tokens, base, layout, components, admin, responsive
└── ui/
    └── render/             Focused DOM renderers by screen responsibility
```

The code follows these boundaries:

- Provider DTOs are converted into ScoreX domain models at the service boundary.
- Renderers receive application state; they do not fetch or persist data.
- Prediction and admin rules are implemented as testable domain functions.
- Every client account stores a shareable Admin ID, separate from admin login credentials.
- Every wallet mutation produces a transaction-ledger entry and rejects negative balances.
- Browser storage is isolated behind one service for later replacement by Cloudflare D1.
- API output is escaped before HTML rendering, and external URLs are restricted to HTTPS.

## Live data

ScoreX uses the free [SportScore API](https://sportscore.com/developers/), discovered through [public-apis/public-apis](https://github.com/public-apis/public-apis).

- Football, basketball, cricket, and tennis
- Live, upcoming, and recently completed matches
- Upcoming matches grouped by local date with Today, Tomorrow and Later filters
- 90-second refresh interval
- 60-second manual-refresh guard aligned with the provider cache window
- Last successful response cached locally
- Partial provider failures do not remove healthy sport feeds
- No frontend API key required
- Required visible `Powered by SportScore` attribution

SportScore documents a free allowance of approximately **10,000 requests per 24 hours per IP** and a **60-second edge cache**. ScoreX's automatic schedule requests four sport feeds every 90 seconds only while the page is visible: a baseline of `4 × 960 = 3,840` requests per continuously open browser each day. Manual and automatic refreshes share a 60-second minimum interval, so even continuous manual use is capped at `4 × 1,440 = 5,760` requests per day, before cache reuse. Each request asks for the documented maximum of 50 matches.

SportScore supplies match data, not bookmaker odds. ScoreX generates deterministic, virtual-only SXC multipliers and labels them separately from the score provider.

## Product safeguards

- SXC uses an original ScoreX Coin asset and remains virtual-only.
- The guided demo teaches schedule browsing, outcome selection, virtual staking and tracking without placing anything automatically.
- Provider team logos fall back to generated initials when a source image fails.
- Admin creation validates names, emails, roles and duplicate accounts.
- Market suspensions persist across provider refreshes in the same browser.
- The interface has keyboard focus indicators, reduced-motion support, status announcements and mobile layouts.

## Account and wallet demo

Visitors can browse scores and schedules without an account. Selecting a market, opening prediction history, using an SXC wallet, or entering the Admin Console requires the appropriate login.

- Normal-user registration requires an active shareable Admin ID.
- User profiles show SXC balance, prediction history, wins, returns and wallet activity.
- “Add SXC” creates a fixed-amount QR preview and a pending request for the linked admin.
- Linked admins can credit or debit a user wallet, approve a top-up request, and see the action in the audit log.
- SXC conversion and QR payment details are portfolio-demo data; there is no payment gateway or automatic crediting.

Demo credentials:

| Account | Email | Password | Shareable Admin ID |
| --- | --- | --- | --- |
| Normal user | `demo@scorex.demo` | `ScoreX@2026` | — |
| Super admin | `superadmin@scorex.demo` | `ScoreX@2026` | `SXA-ATUL-01` |

The browser hashes passwords before local persistence, but this frontend-only mode is intentionally not production authentication. A real multi-user release needs server-side sessions, rate limiting, password-reset/email-verification flows, a database transaction for each wallet update, and authoritative server-side authorization.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run check
```

The development server runs at `http://localhost:8080` and the production build is generated in `dist/`.

## Cloudflare Workers deployment

The repository includes `wrangler.jsonc` for Cloudflare Workers static assets. In the **Import a repository** setup screen, use:

- Project name: `scorex`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: repository root

The built `dist` directory is deployed to the `scorex` Worker, SPA fallback routing is enabled, and non-production branches can generate preview versions. The `public/_headers` file adds a restrictive Content Security Policy and other browser security headers to the deployed static assets.

## Current persistence boundary

Live scores are real and can be requested directly because SportScore is CORS-open and does not require a secret. User/admin accounts, SXC balances, predictions, top-up requests, and audit logs remain browser-local. Secure accounts shared across devices require Cloudflare Workers authentication and D1 persistence.
