# ScoreX

ScoreX is a modular TypeScript web application for real live-sports scores and virtual **ScoreX Coin (SXC)** predictions. SXC is non-transferable, has no cash value, and cannot be purchased or redeemed.

## Architecture

```text
src/
├── app/                    Application orchestration and event handling
├── config/                 Runtime constants and default data
├── domain/                 Types, provider mapping, selectors, market rules
├── features/
│   ├── admin/              Admin account and market-control logic
│   └── predictions/        Selection, multiplier, and return logic
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
- Browser storage is isolated behind one service for later replacement by Cloudflare D1.
- API output is escaped before HTML rendering, and external URLs are restricted to HTTPS.

## Live data

ScoreX uses the free [SportScore API](https://sportscore.com/developers/), discovered through [public-apis/public-apis](https://github.com/public-apis/public-apis).

- Football, basketball, cricket, and tennis
- Live, upcoming, and recently completed matches
- 90-second refresh interval
- Last successful response cached locally
- Partial provider failures do not remove healthy sport feeds
- No frontend API key required
- Required visible `Powered by SportScore` attribution

SportScore supplies match data, not bookmaker odds. ScoreX generates deterministic, virtual-only SXC multipliers and labels them separately from the score provider.

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

Live scores are real and can be requested directly because SportScore is CORS-open and does not require a secret. User/admin accounts, SXC balances, predictions, and audit logs remain browser-local. Secure accounts shared across devices require Cloudflare Workers authentication and D1 persistence.
