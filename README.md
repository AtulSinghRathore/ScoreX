# ScoreX

ScoreX is a virtual sports-market prototype. It provides a fast sportsbook-style interface using simulated live scores, changing demo odds, and **ScoreX Coin (SXC)** — a virtual, non-transferable credit with no cash value.

## Included demo features

- Live/upcoming cricket, football, and tennis events
- Simulated live score and odds updates every four seconds
- Virtual market selection, virtual bet slip, stake controls, and open bets
- ScoreX Coin balance, with no payments, deposits, or withdrawals
- Multiple local demo admin accounts and roles
- Admin creation, deactivation/reactivation, role selection, market suspension, and audit log

## Run locally

This first rebuild is static and has no dependency install step. Open `index.html` in a browser, or run a local static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Important

All data is simulated. A production version would need server-side authentication, PostgreSQL, licensed sports-data/odds providers, and jurisdiction-specific compliance before it could handle anything beyond virtual credits.
