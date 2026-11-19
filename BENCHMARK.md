# Gemini 4 Neon — Independent 3D Game Development Evaluation

**Project:** Kurogane III  
**Publisher:** Axon Stream AI  
**Evaluation type:** Independent real-world coding case study  
**Status:** Evidence collection pending — **no verified score published**  
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
| Browser, OS and hardware | Pending |
| Screen recording | Pending link |
| Public game URL | Pending verified deployment |

## Functional test matrix

Use **PASS / FAIL / NOT TESTED**, recording environment, steps, observed result, logs and evidence for every item.

| Test | Status | Evidence |
|---|---|---|
| Dependency installation | NOT TESTED | — |
| TypeScript type-check | NOT TESTED | — |
| Production build | NOT TESTED | — |
| Browser loads game | NOT TESTED | — |
| Character selection | NOT TESTED | — |
| Movement and combat inputs | NOT TESTED | — |
| Collision / damage / win conditions | NOT TESTED | — |
| Tournament progression | NOT TESTED | — |
| Local two-player gameplay | NOT TESTED | — |
| Mobile controls | NOT TESTED | — |
| Multiplayer across two real clients | NOT TESTED | — |
| Ranked results cannot be forged | NOT TESTED | — |
| Leaderboard survives restart | NOT TESTED | — |
| Public Vercel play test | NOT TESTED | — |

## Evaluation methodology

1. Preserve the **exact** original prompt and untouched initial output as evidence.
2. Record timestamps, iteration count, tools used, errors and manual changes.
3. Run `npm install`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`; retain console output.
4. Execute each gameplay test with reproducible input steps and capture recordings.
5. Verify multiplayer with two independent browser sessions against a persistent WebSocket backend.
6. Record failures as failures. Do not count features merely because code or UI labels exist.
7. Distinguish **initial AI-generated output**, **subsequent fixes**, and **final deployed behavior**.
8. Publish results only after linking evidence and identifying the exact tested commit.

## Results

**No aggregate benchmark score is currently available.** A screenshot, preview, or one successful game launch is insufficient to establish model-level coding performance. Do not compare this experiment's results numerically with Terminal-Bench, SWE-bench or other standardized benchmarks.

## Links

- Source: https://github.com/HaroonBadshahAI/gemini-4-neon-3d-game-benchmark
- Public play test: Pending
- Video demonstration: Pending verified URL

**Axon Stream AI — Engineering What's Next.**
