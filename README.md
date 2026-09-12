# Jacques — Agentic Sous Chef

Production: https://thought-partners-mu.vercel.app (auto-deploys from `main`).

## Run locally

```bash
pnpm install
cp .env.example .env.local   # set OPENROUTER_API_KEY
pnpm dev                     # http://localhost:3000
```

`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Feature map

Jacques is a PWA sous chef that turns recipes into a step-by-step cooking flow. The current repo includes the scaffold, fixture data, seeded recipes, sample Cooklang recipes, and planning docs for the AI-backed routes.

- **Core walkthrough:** `docs/PLAN.md` defines the target `RecipePlan` contract, step UI, timers, question cards, generated images, vision verdicts, heartbeat check-ins, and voice controls.
- **Watch Me:** `docs/WATCH_ME_PLAN.md` defines camera-assisted coaching. Watch Me uses sampled camera frames plus voice/tool events so Jacques can stay quiet by default and speak only when a visible cooking cue needs action.
- **Sample recipes:** `samples/cooklang/` contains curated Cooklang-style recipes grouped by `familiar/`, `exotic/`, and `centerpiece/`. See `samples/AGENTS.md` for the recipe conventions and `-- watch:` visual cue format.
- **Design system:** `DESIGN.md` is the required visual source of truth for cooking screens.

## Kill switches (URL query)

| Flag | Effect |
| --- | --- |
| `?fixture=1` | Loads `src/fixtures/plan.carbonara.json`, calls no `/api/*` routes, works offline after prewarm. |
| `?noimages=1` | No step images are rendered or fetched. |
| `?novoice=1` | Voice hook is not mounted. |
| `?nowatch=1` | Watch Me camera-assisted coaching is hidden/disabled. |

## Offline prewarm (before a demo)

1. Open `/?fixture=1` online and wait a few seconds for the service worker to activate.
2. Reload twice.
3. Disable the network and confirm the page and step images still load.

## Health

`GET /api/health` → `{ status, uptimeMs, timestamp, keys: { openrouter: boolean } }`. `keys.openrouter` must be `true` on production.

## Docs
Start with `AGENTS.md` for agent-facing repo guidance, especially before implementing Dave's Google Stitch UX.


- `AGENTS.md` — agent-facing repo map, Stitch UX integration notes, Watch Me and sample recipe pointers
- `docs/PLAN.md` — build plan, frozen contracts, Watch Me priority, and sample recipe fixture note
- `docs/WATCH_ME_PLAN.md` — Watch Me feature plan and OpenRouter streaming architecture
- `docs/features/glue-and-deploy/system-design.md` — Track C (glue, deploy, kill switches, heartbeat)
- `samples/AGENTS.md` — sample recipe collection guide and Watch Me cue conventions
- `DESIGN.md` — visual design system, including Watch Me panel guidance
