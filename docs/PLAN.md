# Jacques POC — 4 Hour Build Plan (3 people + coding agents)

## 1. What we demo (define this first, build backwards)

3-minute demo, in order:

1. Paste a recipe URL/text → "Jacques is planning…" → task plan appears (mise en place grouped, parallelizable steps flagged).
2. Hit Start → full-screen step card: instruction, timer, generated technique image ("pole-to-pole onion"), 3 suggested question cards.
3. Click a question card → streamed answer inline, no page change.
4. Tap mic → say "what do I do next?" / "how small is finely diced?" → Jacques answers by voice and the UI advances with him.
5. Long step (simmer) → heartbeat toast: "3 min in — is it at a bare bubble or a rolling boil?"
6. Snap a photo of the cutting board → verdict card: ✅/⚠️ + one concrete fix.

**Priority ladder (cut from the bottom, not the top):**

| Prio | Feature | Owner track |
|---|---|---|
| P0 | Recipe → task plan → stepped walkthrough UI | A + B |
| P0 | Question cards + streamed Q&A | A + B |
| P1 | Generated technique images | A |
| P1 | Voice mode (realtime, tool-driven UI control) | C |
| P2 | Vision check ("does this look right?") | A + B |
| P2 | Watch Me (Realtime voice + sampled camera frames) | B + C |
| P3 | Heartbeat check-ins | B |
| cut | Cooklang import, nutrition, diet variants, auth, persistence | — |

## 2. Architecture decisions (locked — do not relitigate mid-build)

- **One Next.js app** (App Router, TypeScript, Tailwind), deployed to Vercel. No separate backend, no DB. Server routes hold the sole `OPENROUTER_API_KEY` and proxy every model call through OpenRouter.
- **The backbone is a JSON plan, not a live agent loop.** One structured generation at import time (`generateObject` + zod) produces a `RecipePlan`. The walkthrough renders deterministically from it. Reason: an agent improvising the whole walkthrough live is unwatchable on stage (latency, drift) and untestable in 4 hours. LLM calls stay at the leaves: Q&A, images, vision verdict, heartbeat line, voice.
- **"Generative UI" = typed component registry**, not AI SDK RSC (`streamUI`; RSC track is paused upstream). Each step has a `kind` (`prep` | `heat` | `wait` | `combine` | `plate` | `check`) and the UI picks a component per kind. Agent output selects and fills components; it does not emit markup.
- **Voice:** OpenRouter audio streaming (`openai/gpt-audio-mini`) through our server route — never ship the API key. The browser posts microphone turns and receives SSE audio/transcript/tool events. Each turn includes the current step plus tools that mutate app state (`next_step`, `prev_step`, `repeat_step`, `start_timer`, `ask_question`). Voice controls the same store the buttons do.
- **Images:** OpenRouter Image API (`google/gemini-3.1-flash-lite-image`; fall back to `google/gemini-2.5-flash-image`) — **pre-generated at plan time**, cached by prompt hash, never blocking a step render. Style prompt is fixed (clean instructional sketch, white background, top-down) so the set looks coherent.
- **Vision:** single multimodal call, photo + step context → strict JSON verdict. No agent loop.
- **Model pins live in exactly one file** (`src/lib/models.ts`) as namespaced OpenRouter model IDs, so a rate limit or outage is a one-line swap.
- **Sample recipes:** curated Cooklang-style samples live in `samples/cooklang/`, grouped by `familiar/`, `exotic`, and `centerpiece`. Cooklang import remains cut from the POC; the samples are demo/planner fixtures and include `-- watch:` comments for Watch Me visual cues.
- **Fixture-first:** `src/fixtures/plan.carbonara.json` is committed in the first 15 minutes. UI work never waits on the parser, and the demo has a keyboard fallback if the network dies.

## 3. Frozen contracts (written at T+0:15, changed only by announcing in chat)

`src/lib/types.ts`:

```ts
export type StepKind = 'prep' | 'heat' | 'wait' | 'combine' | 'plate' | 'check';

export interface Ingredient { name: string; qty?: number; unit?: string; prep?: string }

export interface Step {
  id: string;                    // "s1"
  kind: StepKind;
  title: string;                 // "Dice the onion pole-to-pole"  (≤ 60 chars)
  detail: string;                // 1–3 sentences, spoken aloud verbatim
  durationSec?: number;          // drives timer + heartbeat
  attentionSec?: number;         // heartbeat interval; default durationSec/3
  ingredients: string[];         // ingredient names used here
  tools?: string[];              // "chef's knife", "10-inch skillet"
  parallelWith?: string[];       // step ids safe to run concurrently
  imagePrompt?: string;          // set by planner, consumed by image pregen
  imageUrl?: string;             // filled by pregen; may be undefined
  questions: string[];           // exactly 3 suggested question cards
  doneWhen?: string;             // sensory cue: "edges translucent, no browning"
}

export interface RecipePlan {
  id: string;
  title: string;
  servings: number;
  totalMinutes: number;
  ingredients: Ingredient[];
  equipment: string[];
  steps: Step[];                 // already ordered optimally, mise en place first
}

export interface VisionVerdict {
  status: 'good' | 'close' | 'off';
  observed: string;              // what Jacques sees
  fix?: string;                  // one actionable correction
}
```

API surface (owner A implements, owners B/C consume):

| Route | Method | In | Out |
|---|---|---|---|
| `/api/import` | POST | `{ url?: string; text?: string }` | `RecipePlan` (JSON, images may be pending) |
| `/api/images` | POST | `{ planId, steps: {id, imagePrompt}[] }` | `{ [stepId]: imageUrl }` |
| `/api/ask` | POST | `{ planId, stepId, question, plan }` | text stream |
| `/api/vision` | POST | multipart: `image`, `stepId`, `plan` | `VisionVerdict` |
| `/api/heartbeat` | POST | `{ stepId, elapsedSec, plan }` | `{ line: string }` (≤ 20 words) |
| `/api/realtime` | POST | multipart: `audio?`, `image?`, `step`, `plan` | SSE audio, transcript, and tool events |

Client state (owner B owns the store, owner C only calls its actions) — `src/lib/store.ts`, Zustand:

```ts
{ plan, stepIndex, cards, activeTimer, generation,
  setPlan(plan), next(), prev(), repeat(), goto(i), startTimer(sec), cancelTimer(), pushCard(card) }
// exported: useStore (Zustand hook), selectActiveTimer(state) → { stepId, startedAt, sec, generation } | undefined
// Card = { kind: "heartbeat"; stepId; line } | …  — see docs/features/glue-and-deploy/system-design.md §5
```

## 4. Work split — disjoint file ownership

Three tracks, chosen so nobody edits the same file. Conflicts are the #1 killer at this size.

### Track A — Planner & Agent Brains (server only)

Owns `src/app/api/**` except `src/app/api/health/**`, `src/lib/prompts/**`, `src/lib/models.ts` values, `src/fixtures/**` after the contract commit.

- `RecipePlan` generation: URL fetch → readable text → `generateObject` with the zod mirror of `RecipePlan`. Hard prompt requirements: mise en place first, merge trivially-serial steps, mark `parallelWith`, always 3 `questions`, always a `doneWhen`, `imagePrompt` only for steps where a visual actually teaches something (knife cuts, doneness, folds).
- `/api/ask`: streams; system prompt carries whole plan + current step; answer style "≤ 60 words, imperative, no preamble".
- Image pregen + on-disk/blob cache keyed by `sha256(imagePrompt)`. Fire it async right after plan generation; UI fills in as URLs arrive.
- `/api/vision`: strict JSON verdict, temperature 0, refuse-to-guess rule ("if the photo is unclear, say `off` with `fix: retake closer`").
- `/api/heartbeat`: one short spoken-style line.
- Deliverable proof: `curl` each route, paste real JSON into chat at each checkpoint.

### Track B — Walkthrough UI & Design System (client only)

Owns `src/app/page.tsx` and `src/app/(app)/**` pages, `src/components/**`, `src/lib/store.ts`, `tailwind.config`, globals.

- Kitchen-grade shell: huge type, dark bg, thumb-sized hit targets, works on a phone propped against a bowl.
- `StepCard` variants per `StepKind`; `Timeline`/progress rail; `QuestionCards`; `Timer` with ring; `ImagePanel` with skeleton→fade-in; `CameraCapture` (`<input type="file" capture="environment">` — no getUserMedia plumbing needed); `VerdictCard`; `HeartbeatToast`.
- Build entirely against `fixtures/plan.carbonara.json` until checkpoint 1. Keyboard shortcuts `→ ← r` for the stage.
- Deliverable proof: screen-share the walkthrough driven by fixture, then by live `/api/import`.

### Track C — Voice, Glue, Deploy (integration owner)

Owns `src/lib/glue/**`, `src/lib/realtime/**`, `src/app/api/realtime/**`, `src/app/api/health/**`, `src/app/layout.tsx`, `.env.example`, `vercel.json`, Vercel project, README/pitch.

- **First 15 min: contract commit on `main`** (existing pnpm scaffold, `src/lib/types.ts` verbatim from §3, fixture file, empty route handlers returning fixture/501). Everything else in the team unblocks off this commit. Done: see `docs/features/glue-and-deploy/system-design.md`.
- **Deploy to Vercel before writing any voice code** — a broken deploy discovered at T+3:30 is a lost demo.
- `useJacquesVoice()` hook: capture microphone turns → POST to the server-side OpenRouter proxy → play streamed audio and handle transcript/tool events → call store actions. Send `plan` + current step with every turn so Jacques always knows where we are.
- Heartbeat wiring: when a `wait` step's `attentionSec` elapses, `/api/heartbeat` → speak line via the live session if connected, else toast.
- Owns merges, env keys, and the demo run-through. Also owns the **kill switches**: `?novoice=1`, `?fixture=1`, `?noimages=1`, `?nowatch=1`.

## 5. Timeline (T = start, hard checkpoints)

| Time | A (Planner) | B (UI) | C (Voice/Glue) |
|---|---|---|---|
| 0:00–0:15 | draft plan schema + planner prompt in scratch | sketch step states / pick type scale | **scaffold + push `main` with types & fixture**; create Vercel project |
| 0:15–1:15 | `/api/import` returning real `RecipePlan` | walkthrough driven by fixture | token route + mic → audio round trip proven; **deploy live** |
| **1:15** | **Checkpoint 1 (10 min, all hands):** merge; live import renders in UI on the deployed URL. Nothing else starts until this is true. | | |
| 1:15–2:15 | image pregen + `/api/ask` stream | question cards, timers, image panel, camera button | voice tools → store actions; step context injection |
| **2:15** | **Checkpoint 2:** P0+P1 run end-to-end on the deployed URL, on a phone. | | |
| 2:15–3:15 | `/api/vision`, `/api/heartbeat`, prompt tuning on the real demo recipe | verdict card, heartbeat toast, empty/error states | latency trims, fallbacks, mobile layout, kill switches |
| **3:15** | **Feature freeze.** Bugfix only. | | |
| 3:15–3:40 | two full run-throughs on the actual demo device, in the demo network | | |
| 3:40–4:00 | rehearse pitch, record a backup screen capture, write README | | |

If Checkpoint 1 slips past T+1:35: cut vision (P2) and heartbeat (P3) immediately and say so out loud. If Checkpoint 2 slips: cut voice to "push-to-talk answers one question" and keep the visuals.

## 6. Rules for the coding agents (this is what keeps 3 agents from fighting)

- **One agent per track, scoped to that track's files.** Never let an agent "fix" a file outside your ownership column — message the owner instead.
- `src/lib/types.ts` is frozen after T+0:15. Need a field? Announce it, add it additively (optional), never rename.
- **No formatters, no linters, no repo-wide test runs during the build.** One `bun run build` per checkpoint, run by C.
- **No tests this session** except a throwaway `curl`/script to prove a route works. Hackathon POC; tests are permanent load we won't carry.
- Commit small, push often, rebase on `main` before every push. Long-lived branches are banned.
- Prompts and model ids live in Track A's files only; if two people tune prompts we lose the afternoon.

## 7. Risks and pre-mitigations

| Risk | Mitigation, decided now |
|---|---|
| Recipe URL is JS-rendered / blocked | Textarea paste path is the primary demo input; URL is a bonus |
| Structured output fails schema | zod + one retry with the validation error appended; fixture fallback |
| Image latency stalls the demo | pregen + cache; `imageUrl` is optional and the card renders without it |
| Mic/room audio on stage | test with the actual laptop + a wired headset before T+3:15; `?novoice=1` exists |
| Venue wifi dies | `?fixture=1` renders the full walkthrough with zero network; backup recording at T+3:40 |
| Streaming voice cost/quota burn | `openai/gpt-audio-mini` through OpenRouter, start on click only, abort on stop/unmount; don't leave a stream open while coding |
| Camera on laptop is bad | demo vision from a phone on the deployed URL |

## 8. Immediate next action

Track C runs the scaffold now:

```bash
bunx create-next-app@latest . --ts --tailwind --app --use-bun --eslint --no-src-dir=false
# then: src/lib/types.ts (verbatim from §3), src/fixtures/plan.carbonara.json,
#       stub handlers for all 6 routes, push main, import to Vercel, share URL
```

A and B do not wait — they draft prompt and UI states in scratch files and paste them in after the first pull.
