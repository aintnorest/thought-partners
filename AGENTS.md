<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Jacques Agent Guide

Start here before changing this repo.

## Product

Jacques is an agentic sous chef PWA. The target flow is: recipe input → structured cooking plan → one-step-at-a-time walkthrough → timers, question cards, generated visuals, voice, vision checks, heartbeat prompts, and Watch Me camera-assisted coaching.

## Read these first

1. `README.md` — repo map, local commands, production URL, kill switches.
2. `DESIGN.md` — required visual system for every UI surface.
3. `docs/PLAN.md` — build plan, frozen contracts, ownership, priorities.
4. `docs/WATCH_ME_PLAN.md` — Watch Me architecture, UX, tools, and acceptance criteria.
5. `samples/AGENTS.md` — sample recipe conventions and `-- watch:` visual cue format.

## Current implementation shape

- Next.js App Router PWA.
- AI calls use server-side OpenRouter; browser code must not expose `OPENROUTER_API_KEY`.
- Current recipe data lives in `src/lib/recipes.ts` as seeded in-memory `Recipe` / `RecipeStep` objects.
- `RecipeStep.doneWhen` is the visual cue field Watch Me can use now.
- Richer `RecipePlan` / `Step` contracts are documented in `docs/PLAN.md`; do not silently invent a second schema.
- Sample Cooklang-style recipes live under `samples/cooklang/` grouped by `familiar/`, `exotic/`, and `centerpiece/`.

## Google Stitch / UX integration rules

When importing or implementing Dave's Google Stitch UX:

- Treat `DESIGN.md` as the source of truth over raw Stitch defaults.
- Preserve the Jacques cooking flow: one active step, large type, thumb-safe bottom controls, dark kitchen-grade shell.
- Include room for these controls: previous, timer, next, mic, camera/check, and Watch Me.
- Include a Watch Me surface, not just a generic camera button: camera preview, current `doneWhen`/`-- watch:` target, latest fix/readiness card, stop control.
- Keep visual states aligned with semantic colors from `DESIGN.md`: Herb Green ready, Saffron Amber coach/check, Brick Red issue.
- Use existing data/contracts first. If the design needs new fields, add them additively and document the consumer.
- Do not replace sample recipes with placeholder marketing copy; use `samples/cooklang/` or `src/fixtures/plan.carbonara.json` for realistic content.

## Kill switches

Support these URL flags when touching related surfaces:

- `?fixture=1` — offline fixture flow.
- `?noimages=1` — hide/fallback generated images.
- `?novoice=1` — disable voice mounting.
- `?nowatch=1` — hide/disable Watch Me.

## Boundaries

- No food-safety guarantees from camera or vision.
- No knife-safety guarantees.
- No fabricated nutrition or metrics.
- Cooklang import is not part of the POC unless explicitly assigned; current samples are fixtures/content for demos and planners.
- Keep implementation boring: typed data, small components, server-owned secrets, no parallel UI contract forks.
