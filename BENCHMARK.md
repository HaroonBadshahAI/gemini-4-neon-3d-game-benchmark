# Gemini 4 Neon — Independent 3D Game Development Evaluation

**Project:** Kurogane III  
**Publisher:** Axon Stream AI  
**Evaluation type:** Independent real-world coding case study  
**Status:** Public deployment and mobile gameplay observed; additional tests pending — **no aggregate benchmark score published**  
**Official affiliation:** None; this is not a Google-approved benchmark.

## Objective

Evaluate whether a model can produce a functioning browser-based 3D fighting game from the original natural-language prompt. Measure generated code quality, functional behavior, completion time and manual intervention using repeatable checks.

## Reproduction metadata

| Field | Evidence / value |
|---|---|
| Exact model name and version | Pending primary-source confirmation |
| Original unmodified prompt | Pending — attach verbatim |
| Prompt submission timestamp | Pending |
| First generated playable result timestamp | Pending |
| Tool/platform and configuration | Pending |
| Number of prompts or retries | Pending |
| Human edits and follow-up assistance | Pending |
| Original generated commit or archive | Pending |
| Final reviewed commit SHA | Pending |
| Browser, OS and hardware | iPhone mobile browser visible in user-supplied screen recording; exact device/OS version not established |
| Screen recording | User-supplied `ScreenRecording_11-19-2026 06-01-18_1.mp4` (79.85 seconds; not yet hosted publicly) |
| Public game URL | https://gemini-4-neon-3d-game-benchmark.vercel.app/ — HTTP 200 verified, 2026-11-19 |

## Functional test matrix

Use **PASS / FAIL / NOT TESTED**, recording environment, steps, observed result, logs and evidence for every item.

| Test | Status | Evidence |
|---|---|---|
| Dependency installation | NOT TESTED | — |
| TypeScript type-check | NOT TESTED | — |
| Production build | NOT TESTED | — |
| Browser loads game | PASS (observed) | Mobile recording at 00:05–00:50 shows active game in browser |
| Character selection | NOT TESTED | — |
| Movement and combat inputs | PASS (observed) | Mobile recording shows fighters exchanging blows, changing health, and a 6-hit KO at 00:05; input-to-action causality not independently instrumented |
| Collision / damage / win conditions | PASS (observed) | 00:05 shows PERFECT K.O., 6 hits, 86 damage and round win; detailed collision edge cases remain untested |
| Tournament progression | PASS (observed) | 00:05 Stage 1/4 and 00:18–00:50 Stage 2/4 |
| Local two-player gameplay | NOT TESTED | — |
| Mobile controls | PASS (observed) | On-screen D-pad, block, jab, kick, throw and special controls during live mobile gameplay; exhaustive control testing pending |
| Multiplayer across two real clients | NOT TESTED | — |
| Ranked results cannot be forged | NOT TESTED | — |
| Leaderboard survives restart | NOT TESTED | — |
| Public Vercel play test | PASS (observed) | Live production URL returned HTTP 200; mobile recording demonstrates game rendering and combat; independent browser automation pending |

## Evaluation methodology

1. Preserve the **exact** original prompt and untouched initial output as evidence.
2. Record timestamps, iteration count, tools used, errors and manual changes.
3. Run `npm install`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`; retain console output.
4. Execute each gameplay test with reproducible input steps and capture recordings.
5. Verify multiplayer with two independent browser sessions against a persistent WebSocket backend.
6. Record failures as failures. Do not count features merely because code or UI labels exist.
7. Distinguish **initial AI-generated output**, **subsequent fixes**, and **final deployed behavior**.
8. Publish results only after linking evidence and identifying the exact tested commit.

## Verified observations — 2026-11-19

The user supplied an 79.85-second iPhone screen recording of the deployed game. At 00:05 it shows Stage 1/4, Round 2 and a PERFECT K.O.; at 00:18 it shows Stage 2/4, Round 1 with two fighters in combat; at 00:50 it shows Stage 2/4, Round 2 with mobile controls and health changes. At 01:10 the Online Arena panel displays **Offline · 1 Online · 0 In Queue** and disabled matchmaking controls. This is **not evidence that real multiplayer works**. The recording is available to the evaluator in the conversation but has not been published in this repository; readers cannot independently inspect it until an evidence URL is added.

Vercel production deployment was reported READY for commit `5de40fe9b84946eeba4c8ead25edadaf161d295d`; public homepage and GET `/api/leaderboard` returned HTTP 200. The leaderboard GET showed eight seeded records, **not verified real player results**. `/api/health` returned HTTP 404 because that route is absent. The deployment READY state does not replace a locally captured TypeScript, lint, or test-suite report.

**PASS (observed)** in this matrix means directly supported by the recording or endpoint response, **not exhaustive automated verification**. Other items remain NOT TESTED until repeatable evidence is collected.

## Results

**No aggregate benchmark score is currently available.** A screenshot, preview, or one successful game launch is insufficient to establish model-level coding performance. Do not compare this experiment's results numerically with Terminal-Bench, SWE-bench or other standardized benchmarks.

## Links

- Source: https://github.com/HaroonBadshahAI/gemini-4-neon-3d-game-benchmark
- Public play test: https://gemini-4-neon-3d-game-benchmark.vercel.app/ (mobile gameplay observed; online multiplayer unverified)
- Video demonstration: Pending verified URL

**Axon Stream AI — Engineering What's Next.**
