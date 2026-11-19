# Security and Responsible Public Testing

## Current release status

This repository is an experimental game and **must not be represented as a secure ranked multiplayer service** without further hardening.

### Ranked leaderboard

The original `POST /api/leaderboard` endpoint accepted untrusted client-supplied win/loss, opponent rating and bonus rating-point values. This allows fabricated ranked results. The accompanying patch disables ranked submissions by default with HTTP 503. **Do not enable public ranked writes** until the server verifies completed matches, identifies players securely, calculates scores authoritatively, rate-limits requests and stores results transactionally in a persistent database.

The `ENABLE_UNVERIFIED_RANKED_WRITES` switch exists only to reproduce the original behavior in a controlled private test. Never enable it in a public deployment.

### WebSocket multiplayer

The custom `server.ts` uses in-memory rooms and client-relayed game state. It requires further protocol validation, connection limits, origin checks, authoritative game-state handling and abuse controls before production use. Deploy the WebSocket service separately when hosting the frontend on Vercel.

### Secrets

- Keep `.env` files and API keys out of Git; `.gitignore` already excludes `.env*` except `.env.example`.
- Never put private keys in `NEXT_PUBLIC_*` variables or client-side JavaScript.
- Run a repository **and commit-history** scan with Gitleaks or GitHub secret scanning.
- Rotate any secret that was ever committed, even if later deleted.
- The example `GEMINI_API_KEY` value is a placeholder, not a verified runtime requirement.

### Reporting vulnerabilities

Use GitHub's private vulnerability reporting feature if enabled; otherwise contact the repository owner privately. Do not publish exploitable secrets or personal information in an issue.
