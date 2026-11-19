# Public Game Deployment Readiness

## Architecture

- Next.js frontend and API routes: candidate for Vercel hosting after a verified build.
- Persistent `/ws` multiplayer server: **not supported inside standard Vercel Functions**. Host separately on an environment that supports persistent WebSockets.
- Browser WebSocket client currently connects to the page host; it must support a configured `NEXT_PUBLIC_WS_URL` for split deployment.
- Local JSON/in-memory leaderboard: unsuitable for persistent public rankings. Replace with a database before enabling ranked writes.

## Launch checklist

- [ ] Verify `npm run lint`, `npx tsc --noEmit`, and `npm run build`
- [ ] Configure a persistent WebSocket backend and `NEXT_PUBLIC_WS_URL`
- [ ] Add connection authentication, input validation and rate limiting
- [ ] Keep unverified ranked writes disabled
- [ ] Configure a persistent database before public ranking
- [ ] Scan repository and history for secrets; rotate exposed credentials
- [ ] Verify gameplay on desktop and mobile
- [ ] Verify multiplayer with two separate clients
- [ ] Confirm real deployment URL and then add it to README, benchmark and YouTube description

Do not advertise a live public play test until the deployment has been tested successfully.
