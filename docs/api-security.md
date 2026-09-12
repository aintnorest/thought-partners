# API endpoint security

What protects the `/api/*` routes today, what it does not cover, and the options for tightening later. The threat is not key theft (the key never leaves the server); it is **credit theft** — anyone reaching the routes can spend OpenRouter credits on model calls that have nothing to do with cooking.

## Current controls (as of `b86d199`)

| Control | Where | What it stops | What it does not stop |
| --- | --- | --- | --- |
| Key held server-side only | every route, `src/lib/openrouter.ts` | Key exfiltration. No route echoes it; `/api/health?probe=1` returns presence and limits only. | Anything that uses the routes as a proxy. |
| OpenRouter key spend limit ($40) | OpenRouter dashboard | Unbounded bills. The hard ceiling. | Losing the demo when the cap is hit. |
| Same-origin gate | `src/proxy.ts` | Scanners, bots, other sites' pages: a request must carry `Sec-Fetch-Site: same-origin` or an `Origin` matching the served host. `GET /api/health` stays open. | Anyone who reads the code and sends `Origin: https://<our host>` from curl. |
| Input shape validation | each route (zod) | Malformed bodies reaching a model. | Well-formed bodies with arbitrary content. |
| Per-request bounds | `/api/vision` 4 MB, `/api/images` ≤ `PLAN_STEPS.max` prompts, `/api/import` 8 s / 1 MB fetch + SSRF guard | Single oversized or hostile requests. | Many normal-sized requests. |
| Image cache (`sha256(imagePrompt)`) | `src/lib/images/cache.ts` | Paying twice for the same prompt on a warm instance. | Novel prompts; cold starts. |

**Residual exposure:** `/api/ask` and `/api/import` are general-purpose LLM completions over client-supplied text (system prompts steer, they do not enforce). `/api/images` is a general image generator (~$0.04 per image). None of the routes is rate-limited or authenticated. The $40 cap is the only thing bounding a determined abuser.

## Options, cheapest first

Each is independent; pick by threat, not by order.

### 1. OpenRouter guardrails (dashboard, no code)

Settings › Privacy › Guardrails → create one → assign to the app's key.

- **Prompt Injection Detection**: regex over OWASP patterns, free, negligible latency. Actions: *Flag* (log only), *Redact* (replace matched spans), *Block* (403 before the model). Run *Flag* while testing to see false positives on real recipe text, then *Block*. Our routes already degrade on a 403: import → fixture fallback, ask → 502 `{ error }`, heartbeat → local line, vision → 502.
- **Model / provider allowlist**: restrict the key to exactly the ids in `src/lib/models.ts`. A stolen-key scenario then cannot reach expensive models.
- **Budget limits per key** with alerting, finer than the single account cap.

### 2. Output token caps (one line per route)

Set `maxOutputTokens` on every text call: `plan` ~3 000, `ask` ~200, `vision` ~150, `heartbeat` ~60. Caps the per-call cost and stops prompt-injected "write me a novel" requests from running long. `/api/heartbeat` currently truncates *after* generation; a cap moves that before the bill.

### 3. Rate limiting in `src/proxy.ts`

Per-IP sliding window on `/api/*`, e.g. 30 requests/min overall and 2/min on `/api/images` and `/api/import` (the expensive ones). Storage: `@vercel/kv` or Upstash Redis for correctness across instances; an in-process `Map` is acceptable for a single-instance demo. Return 429 `{ error: "slow down" }`. Note the client heartbeat scheduler fires every `attentionSec` (5 s in the fixture), so the general limit must be ≥ 12/min per active user.

### 4. Shared demo token

A `NEXT_PUBLIC_JACQUES_TOKEN` the client sends as `x-jacques-token`, checked in `src/proxy.ts` against a server-side `JACQUES_TOKEN`. Extractable from the bundle by anyone who looks, so it is not auth — but it stops every scanner, bot, and copy-pasted curl that the origin gate lets through. Rotate by redeploying. Good fit for a demo day; poor fit for a public product.

### 5. Real sessions

Signed, short-lived session cookie issued by a page load (or a login), verified in `src/proxy.ts` (HMAC with a server secret, `httpOnly`, `SameSite=Lax`). Binds spend to a browser session and enables per-session budgets. First option that is actual authentication; costs a cookie flow and a secret.

### 6. Bot challenge

Cloudflare Turnstile (free) or hCaptcha on the import screen; token verified server-side once, then exchanged for a session (option 5). Stops automated abuse of the most expensive entry point without a login.

### 7. Move spend to the user

BYOK: the user pastes their own OpenRouter key, stored encrypted in a session, and routes use it instead of ours. Eliminates credit theft entirely. Only sensible once there are real users.

## Not worth doing

- **CORS headers** — the routes are same-origin; CORS only governs what *other* origins may read, not who may call. The proxy gate already does the useful part.
- **Obfuscating route paths** — `/api/*` is discoverable from the bundle.
- **Client-side rate limiting** — bypassed by anyone not using the client.

## Recommended order if abuse ever shows up

1. Enable the OpenRouter injection guardrail on *Block* and the model allowlist (five minutes, no deploy).
2. Add `maxOutputTokens` (one commit).
3. Add per-IP rate limiting on `/api/images` and `/api/import` (one proxy change plus a KV store).
4. Only then consider tokens or sessions.

How to see whether it is happening: OpenRouter dashboard › Activity shows per-model request counts and spend; `GET /api/health?probe=1` shows `usage` and `limitRemaining` for the key.
