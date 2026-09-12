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

- **Core walkthrough:** the shared components render the step timeline, instructions, timer, question/answer panels, photo verdicts, and heartbeat notices alongside Watch Me. The landing form currently loads the Carbonara sample; its answers and photo verdicts are explicitly scripted UI examples, not live AI results. `docs/PLAN.md` defines the target API-backed flow.
- **Watch Me:** the walkthrough currently checks microphone input and camera capture. `docs/WATCH_ME_PLAN.md` describes the planned AI coaching; transcription, visual assessment, tool events, and spoken responses are not connected.
- **Sample recipes:** `samples/cooklang/` contains curated Cooklang-style recipes grouped by `familiar/`, `exotic/`, and `centerpiece/`. See `samples/AGENTS.md` for the recipe conventions and `-- watch:` visual cue format.
- **Design system:** `DESIGN.md` is the required visual source of truth for cooking screens.

## Microphone and camera check

Open `/?fixture=1`, use the bottom **Microphone capture** control or scroll to **Watch Me**, and select **Start capture**. Allow camera and microphone access to see the live preview and input-level meter. Fixture mode keeps media on the device and sends no API requests. The demo fix/readiness buttons show explicitly scripted examples, not model output. Timers run without stopping capture; navigating to another step releases both devices.

Outside fixture mode, a loaded walkthrough posts microphone chunks and JPEG frames to `/api/realtime` about every 1.5 seconds. That endpoint validates and acknowledges receipt only; it does not forward media to OpenRouter. Recorder chunks are not standalone speech turns.

**Cancel capture**, **Stop capture**, changing steps/recipes, and unmounting release media resources. Late permission grants from a canceled session are stopped rather than reopening capture. If one device is denied, the other can still run.

Use HTTPS or localhost. A phone opened at an HTTP LAN address cannot access media. Check browser permissions and OS privacy settings after a denial. Verify real microphone input separately on the demo phone, including the installed iOS PWA; automated smoke checks use synthetic media.

## Kill switches (URL query)

| Flag | Effect |
| --- | --- |
| `?fixture=1` | Loads `src/fixtures/plan.carbonara.json`, calls no `/api/*` routes, works offline after prewarm. |
| `?noimages=1` | No step images are rendered or fetched. |
| `?novoice=1` | No microphone capture or audio context; Watch Me camera preview remains available. |
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
