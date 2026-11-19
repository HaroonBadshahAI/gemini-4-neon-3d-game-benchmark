# KUROGANE III — Gemini 4 Neon Game Development Evaluation

An **independent, real-world AI-assisted game-development experiment** by **Axon Stream AI**.

This repository contains the source code for **Kurogane III**, a browser-based 3D fighting game built with Next.js, React, TypeScript, Three.js and a custom WebSocket multiplayer server.

> **Evaluation status:** This is a public case study, **not** an official Google benchmark or an independently validated model score. The exact original prompt, generation logs, model settings, elapsed time, human interventions and test outcomes must be documented before making reproducible performance claims.

## What the source implements

- Three.js 3D arena rendering and browser-based fighting gameplay
- Tournament, local two-player and CPU gameplay paths
- Online matchmaking and room support using a custom WebSocket server
- A leaderboard API and ranking logic
- Mobile touch-control support

The public mobile gameplay recording verifies browser rendering, combat, touch controls, knockouts, and tournament progression through Stage 2/4. Other listed modes are code-level features and have not all been independently tested.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The custom server starts the Next.js app and WebSocket endpoint on the same port.

Run checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

**Deployment status:** Vercel reports the production deployment READY and serves the game successfully. This does **not** establish that local lint, TypeScript, and test commands have been executed and passed; their results remain pending in [BENCHMARK.md](BENCHMARK.md).

## Public play test

**Live game:** https://gemini-4-neon-3d-game-benchmark.vercel.app/ — production page returned HTTP 200 and mobile gameplay was observed in the user-supplied screen recording (2026-11-19). **Verified mobile gameplay:** arena renders, touch controls appear, fighters exchange blows, K.O. is displayed, and tournament reaches Stage 2/4. This does not yet verify online multiplayer or durable ranked results.

**Deployment caveat:** The custom `server.ts` hosts persistent WebSockets at `/ws`. Standard Vercel Functions cannot host that long-lived WebSocket server. A Vercel frontend requires a separate WebSocket backend and a configurable client connection URL. Online matchmaking is **not guaranteed to work** by deploying the existing repository to Vercel unchanged.

**Leaderboard caveat:** The existing JSON/in-memory leaderboard is not a durable production datastore. Ranked submissions are disabled by default in this review's security patch because the current API trusts client-provided results. Do not turn them on for public users without authoritative match validation, authentication, and durable storage.

## Benchmark and evidence

See [BENCHMARK.md](BENCHMARK.md) for the evaluation template, verification checklist and evidence requirements. Preserve the original generated version separately from later edits, so visitors can distinguish the model output from subsequent development.

## Security

See [SECURITY.md](SECURITY.md). Never commit real API keys, tokens, private `.env` files or credentials. A game that runs entirely in the browser should not require a Gemini API key just to play.

## Attribution

**Axon Stream AI — Engineering What's Next.**

This is an independent project, not an official Google product or benchmark. Do not treat the public repository as a license to reuse its code; no license is granted until the owner adds a LICENSE file.
