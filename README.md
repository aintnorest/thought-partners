# Jacques — Agentic Sous Chef

Production: https://thought-partners-mu.vercel.app (auto-deploys from `main`).

## Run locally

```bash
pnpm install
cp .env.example .env.local   # set OPENROUTER_API_KEY
pnpm dev                     # http://localhost:3000
```

`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Kill switches (URL query)

| Flag | Effect |
| --- | --- |
| `?fixture=1` | Loads `src/fixtures/plan.carbonara.json`, calls no `/api/*` routes, works offline after prewarm. |
| `?noimages=1` | No step images are rendered or fetched. |
| `?novoice=1` | Voice hook is not mounted. |

## Offline prewarm (before a demo)

1. Open `/?fixture=1` online and wait a few seconds for the service worker to activate.
2. Reload twice.
3. Disable the network and confirm the page and step images still load.

## Health

`GET /api/health` → `{ status, uptimeMs, timestamp, keys: { openrouter: boolean } }`. `keys.openrouter` must be `true` on production.

## Docs

- `docs/PLAN.md` — build plan and frozen contracts
- `docs/features/glue-and-deploy/system-design.md` — Track C (glue, deploy, kill switches, heartbeat)
- `DESIGN.md` — visual design system
