# Design System: Jacques — Agentic Sous Chef (PWA)

**Source of truth for all Jacques screens.** Quote this file in Stitch prompts as "DESIGN SYSTEM (REQUIRED)".

## 1. Visual Theme & Atmosphere

A headlamp-lit kitchen counter at night — deep warm charcoal surfaces, a single ember-orange flame accent, type big enough to read from three feet away with flour on your hands. Atmosphere is confident and calm: the UI is a sous chef standing at your shoulder, not a dashboard. Density is low by design (one step on screen at a time), variance is minimal (cooking is linear), motion is gentle and perpetual (breathing timers, shimmering image skeletons). Kitchen-grade durability governs every choice: dark background hides smudges, 56px touch targets survive wet fingers, fixed bottom controls live in the thumb zone of a phone propped against a mixing bowl.

## 2. Color Palette & Roles

Dark theme, single warm accent. Never pure black; never cool grays on one screen and warm on another.

- **Cast Iron (#1B1916)** — Page background, `theme_color` for the PWA shell. Warm charcoal; reads as "dark," not "gray."
- **Raised Charcoal (#262320)** — Card and sheet surfaces: question cards, verdict card, toast, timeline rail background.
- **Warm Off-White (#F5F2EC)** — Primary text, step titles, timer digits.
- **Stone Gray (#A8A29A)** — Secondary text: meta labels, ingredient quantities, `doneWhen` cues, inactive timeline dots.
- **Whisper Warm (rgba(245,242,236,0.09))** — 1px borders, dividers, input strokes. Structural only; never decorative.
- **Ember Orange (#DE6B3F)** — THE accent. Primary CTA fill, current-step indicator, timer ring sweep, focus rings, dragged timer knob. Nothing else may use it.
- **Herb Green (#5FA87A)** — Semantic status: `good` verdicts, completed timeline steps, success confirmations. Status only — never a button.
- **Saffron Amber (#E2A33C)** — Semantic status: `close` verdicts, heartbeat check-ins, expiring timers (final 10 s), parallel-step warnings.
- **Brick Red (#D9604F)** — Semantic status: `off` verdicts, destructive actions, error text.

## 3. Typography Rules

- **Display & Body: Outfit** (600/700 headers, 400/500 body). Geometric sans with warm, rounded letterforms — friendly enough for a coach, clean enough for instructions. Fallback: `system-ui`.
- **Mono: JetBrains Mono** — Timer digits, elapsed/remaining readouts, measurement quantities, any number the cook compares against a clock. Always tabular figures (`font-feature-settings: "tnum"`).
- **Step titles:** `clamp(2rem, 7vw, 3.25rem)`, weight 700, tracking −0.02em. Readable at arm's length.
- **Step detail (the spoken text):** `clamp(1.25rem, 3.5vw, 1.5rem)`, weight 400, leading 1.55, max 65ch lines.
- **Meta labels & chips:** 0.875rem, uppercase, tracking 0.08em, Stone Gray.
- **Banned:** Inter (default AI slop), all serif fonts (software UI), sub-1rem body text, all-caps for anything except meta labels.

## 4. Component Stylings

- **Buttons:** Pill-shaped (fully rounded). Primary = Ember fill + Cast Iron text. Secondary = ghost outline in Whisper Warm border. Destructive = Brick Red outline, never fill. Active state: tactile `translateY(-1px)` + 5% darken. No outer glows, no gradients. Minimum 56px height, 24px horizontal padding.
- **StepCard (per `StepKind: prep | heat | wait | combine | plate | check`):** One skeleton for all kinds — kind is expressed by a small uppercase chip + line icon at top-left, never by background color. Flat Raised Charcoal, generously rounded corners (1.5rem), Whisper Warm border, no shadow. Only the active step is filled; upcoming steps on the overview are border-only ghosts.
- **Timeline / progress rail:** Top of the walkthrough, horizontal. Dot per step: Herb Green when done, Ember ring when current, Stone Gray hollow when upcoming. Connected by a Whisper Warm hairline; mono step counter ("3 / 9") right-aligned.
- **QuestionCards (exactly 3 per step):** Ghost-outline chips stacked above the bottom controls. Cascade in with staggered delay on step mount; tapping one expands an inline answer panel (streamed text, Raised Charcoal) between the cards and the controls. Shimmer skeleton while streaming.
- **Timer:** JetBrains Mono digits, `clamp(3rem, 12vw, 5rem)`, with a conic Ember ring sweeping around them. Final 10 s flips digits + ring to Saffron Amber with a slow pulse. No alarm-chrome, no flip-clock skeuomorphism.
- **ImagePanel:** 4:3 aspect, generously rounded (1.5rem), Whisper Warm border. Always a skeletal shimmer matching the panel dimensions; generated image fades in over it. If `imageUrl` is undefined the panel renders a composed empty state ("No visual for this step — trust the description"), never a broken-image icon. Fixed prompt style (clean instructional sketch, light background) keeps the image set coherent.
- **CameraCapture:** Ember-filled button, camera line icon, label "Check your work". Uses `<input type="file" capture="environment">` — no getUserMedia plumbing.
- **VerdictCard:** Left status rail (4px, status color: Herb/Saffron/Brick), Raised Charcoal body. Rail + `observed` line + one `fix` line. No shadow; hierarchy comes from the rail, not elevation.
- **HeartbeatToast:** Slides up from above the bottom controls, 4px Saffron Amber left rail, mono elapsed timestamp, ≤ 20-word line. Auto-dismisses on step advance; never stacks more than one.
- **Inputs (import screen):** Label above field, helper below if needed, error text below in Brick Red. Focus ring = Ember at 2px. No floating labels.

## 5. Layout Principles

- **Portrait-first, single column always.** This app never goes side-by-side; landscape and desktop just widen the column toward max-width (640px) centered on Cast Iron.
- **Full step screen via `min-h-[100dvh]`** — never `h-screen`. One step per screen; everything else is chrome.
- **Walkthrough skeleton (top → bottom):** timeline rail → scrollable middle (step title, spoken detail, ImagePanel, `doneWhen` cue) → question cards → fixed bottom control cluster (prev, timer toggle, next, mic, camera) sitting above the safe-area inset.
- **PWA chrome:** pad with `env(safe-area-inset-*)` on all four edges; bottom controls never hide under the home indicator.
- **Touch targets ≥ 56px everywhere**; ≥ 12px gaps between adjacent targets for wet-thumb forgiveness.
- **Whitespace does the separating.** No overlapping elements, no absolute-positioned decorations, no cards stacked on cards. Borders and spacing, not shadows, structure the page.

## 6. Motion & Interaction

- **Spring physics everywhere:** stiffness 100, damping 20. No linear easing, no bounce.
- **Perpetual micro-loops on live elements:** timer ring sweep, Ember pulse on the current timeline dot, shimmer on pending images, soft float on the mic button while listening.
- **Staggered orchestration:** step mount cascades title → detail → image panel → question cards (60ms offsets). Never pop the whole step at once.
- **Transform & opacity only.** Never animate width, height, top, left. Grain/noise, if used, on a fixed pseudo-element only.
- **Verdict and heartbeat entries slide up + fade** (translateY 8px → 0), exit by collapse, never by hard removal.

## 7. Anti-Patterns (Banned)

- No emojis anywhere — including food emoji as step-kind iconography. Line icons only.
- No Inter font. No serif fonts. No pure black (#000000).
- No violet/indigo "AI" accent and no accent beyond Ember; no neon glows or gradient text.
- No glassmorphism, no skeuomorphic kitchen chrome (flashing dials, flip clocks, chef-hat clip art).
- No centered hero layouts or landing-page marketing sections — this is a tool, not a pitch page.
- No 3-column equal card grids; no `calc()` percentage hacks (Grid over Flexbox math).
- No fake metrics or fabricated nutrition numbers; unknown data renders as `[metric]` placeholders.
- No "Scroll to explore" / bouncing chevrons / filler UI text; every element has a job.
- No broken stock-image links: generated images use the fixed instructional-sketch prompt; placeholders are composed empty states.
- No overlapping elements or absolute-positioned text over images — every element owns a clean spatial zone.
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash"). Jacques speaks like a line cook: imperative, short, concrete.
