import type { ReactNode } from "react";

export const metadata = { title: "Design System" };

/* ————————— Spec helper wrappers (docs-page chrome, not product chrome) ————————— */

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-whisper py-10 first:border-t-0">
      <h2 className="mb-6 text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Meta({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-meta uppercase tracking-[0.08em] text-stone">{children}</p>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-prose text-sm leading-relaxed text-stone">{children}</p>;
}

/* ————————— Line icons (DESIGN.md §7: line icons only, never emoji) ————————— */

const ICON = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const, "aria-hidden": true };

const ICONS: Record<string, ReactNode> = {
  prep: (
    <>
      <path d="M18 3 9 12" />
      <path d="M9 12 5.5 15.5a2.1 2.1 0 0 0 3 3L12 15" />
    </>
  ),
  heat: (
    <>
      <path d="M12 3.5c2.5 3.2 4.5 5.6 4.5 9a4.5 4.5 0 0 1-9 0c0-3.4 2-5.8 4.5-9Z" />
      <path d="M12 11.5c1 1.2 1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 .5-1.8 1.5-3Z" />
    </>
  ),
  wait: (
    <>
      <path d="M8 4h8M8 20h8" />
      <path d="M9.5 4c0 3.5 5 5 5 8s-5 4.5-5 8M14.5 4c0 3.5-5 5-5 8s5 4.5 5 8" />
    </>
  ),
  combine: (
    <>
      <path d="M4 13h16a8 8 0 0 1-16 0Z" />
      <path d="M9 21h6M12 3v6" />
    </>
  ),
  plate: (
    <>
      <path d="M6 16a6 6 0 0 1 12 0v1H6Z" />
      <path d="M4 18.5h16M12 9.5V8" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  camera: (
    <>
      <path d="M4 9h3l1.5-2.5h7l1.5 2.5h3v10H4Z" />
      <circle cx="12" cy="14" r="3" />
    </>
  ),
  mic: (
    <>
      <path d="M10 3.5a2 2 0 0 1 4 0v5.5a2 2 0 0 1-4 0Z" />
      <path d="M7 10.5a5 5 0 0 0 10 0" />
      <path d="M12 15.5v3M9.5 20h5" />
    </>
  ),
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg {...ICON} width={size} height={size}>
      {ICONS[name]}
    </svg>
  );
}

const STEPKINDS = ["prep", "heat", "wait", "combine", "plate", "check"] as const;

function KindChip({ kind }: { kind: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-whisper px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.08em] text-stone">
      <Icon name={kind} size={12} />
      {kind}
    </span>
  );
}

/* ————————— Section 2 · Color ————————— */

const BASE_HUES = [
  { token: "cast", name: "Cast Iron", hex: "#1B1916", role: "Page background, PWA theme_color" },
  { token: "raised", name: "Raised Charcoal", hex: "#262320", role: "Card & sheet surfaces" },
  { token: "cream", name: "Warm Off-White", hex: "#F5F2EC", role: "Primary text, timer digits" },
  { token: "stone", name: "Stone Gray", hex: "#A8A29A", role: "Secondary text, inactive dots" },
  { token: "whisper", name: "Whisper Warm", hex: "F5F2EC @ 9%", role: "1px hairlines — structural only" },
];

const STATUS = [
  { token: "herb", name: "Herb Green", hex: "#5FA87A", role: "verdict good · done steps · success" },
  { token: "saffron", name: "Saffron Amber", hex: "#E2A33C", role: "verdict close · heartbeat · expiring timers" },
  { token: "brick", name: "Brick Red", hex: "#D9604F", role: "verdict off · destructive outline · errors" },
];

function Swatch({ token, name, hex, role }: { token: string; name: string; hex: string; role: string }) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-whisper bg-raised/50 p-3 pr-4">
      <span
        className="h-12 w-12 shrink-0 rounded-xl border border-whisper"
        style={{ backgroundColor: `var(--color-${token})` }}
      />
      <span className="min-w-0">
        <span className="block font-semibold text-cream">
          {name}
          <code className="ml-2 font-mono text-xs font-normal text-stone">--color-{token}</code>
        </span>
        <span className="block font-mono text-xs text-stone">{hex}</span>
        <span className="block text-xs text-stone">{role}</span>
      </span>
    </li>
  );
}

/* ————————— Section 3 · Typography ————————— */

function TypeRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="border-t border-whisper py-4">
      <Meta>{label}</Meta>
      {children}
    </li>
  );
}

/* ————————— Section 5+ · Component specimens ————————— */

const buttonBase =
  "inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-semibold transition " +
  "focus-visible:outline-2 focus-visible:outline-ember focus-visible:outline-offset-2 " +
  "active:-translate-y-px disabled:pointer-events-none disabled:opacity-50 " +
  "[&[data-s=hover]:not(:disabled)]:bg-ember/90 [&[data-s=focus]]:outline-2 [&[data-s=focus]]:outline-ember [&[data-s=focus]]:outline-offset-2";

const btnPrimary = `${buttonBase} bg-ember text-cast hover:bg-ember/90 active:bg-ember/90`;
const btnSecondary = `${buttonBase} border border-whisper text-cream hover:bg-whisper`;
const btnDestructive = `${buttonBase} border border-brick text-brick hover:bg-raised`;

function TimelineDemo() {
  return (
    <div className="rounded-card border border-whisper bg-raised/50 p-4">
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <span
              className={[
                "h-3 w-3 shrink-0 rounded-full border",
                i < 2 ? "border-herb bg-herb" : i === 2 ? "border-ember bg-ember pulse-ember" : "border-stone",
              ].join(" ")}
            />
            {i < 4 && <span className="h-px flex-1 bg-whisper" />}
          </div>
        ))}
        <span className="ml-2 font-mono text-sm text-stone">3 / 9</span>
      </div>
      <Note>
        Dot per step: Herb Green when done, Ember ring (pulse) when current, Stone Gray hollow when
        upcoming. Whisper hairline connects; mono counter right-aligned.
      </Note>
    </div>
  );
}

function StepCardDemo() {
  return (
    <div className="rounded-card border border-whisper bg-raised p-5">
      <div className="mb-3 flex items-center">
        <KindChip kind="prep" />
      </div>
      <h3 className="text-step-title font-bold tracking-[-0.02em]">
        Dice the onion pole-to-pole
      </h3>
      <p className="mt-3 max-w-[65ch] text-step-detail leading-[1.55] text-cream/90">
        Halve through the root, peel, then cut top to root end so the layers stay attached.
      </p>
      <p className="mt-4 font-mono text-sm text-stone">doneWhen → edges translucent, no browning</p>
      <Note>
        One skeleton for every StepKind — kind is a chip + line icon, never a background color.
        Active step filled (Raised); upcoming steps on the overview are border-only ghosts.
      </Note>
    </div>
  );
}

function QuestionCardsDemo() {
  return (
    <div>
      <div className="space-y-2.5">
        {["Why pole-to-pole?", "How fine should the dice be?", "Can I use a red onion instead?"].map(
          (q) => (
            <button key={q} type="button" className="block w-full rounded-full border border-whisper px-5 py-3 text-left text-sm text-cream">
              {q}
            </button>
          ),
        )}
      </div>
      <div className="mt-2.5 rounded-2xl border border-whisper bg-raised p-4">
        <div className="space-y-2">
          <div className="shimmer h-3 rounded-full" />
          <div className="shimmer h-3 rounded-full" />
          <div className="shimmer h-3 w-2/3 rounded-full" />
        </div>
      </div>
      <Note>
        Exactly three per step, ghost-outline chips stacked above the controls. Cascade in on step
        mount; tap expands a Raised answer panel with streamed text. Shimmer skeleton while streaming.
      </Note>
    </div>
  );
}

function TimerDemo({ t, final = false }: { t: string; final?: boolean }) {
  const accent = `var(--color-${final ? "saffron" : "ember"})`;
  return (
    <span className="relative inline-flex items-center justify-center p-2">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ background: `conic-gradient(${accent} 25%, transparent 0)` }}
      />
      <span
        className={`relative rounded-full bg-cast px-4 py-3 font-mono text-timer leading-none ${
          final ? "text-saffron pulse-amber" : "text-cream"
        }`}
      >
        {t}
      </span>
    </span>
  );
}

function ImagePanelDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="aspect-[4/3] rounded-card border border-whisper bg-raised p-4">
        <div className="shimmer h-full w-full rounded-xl" />
      </div>
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-card border border-whisper bg-raised p-4">
        <Icon name="plate" size={28} />
        <p className="max-w-[24ch] text-center text-sm text-stone">
          No visual for this step — trust the description
        </p>
      </div>
      <Note>
        4:3 aspect, rounded-card, Whisper border. Skeletal shimmer under the generated
        image; when imageUrl is missing, compose an empty state — never a broken-image icon.
      </Note>
    </div>
  );
}

function VerdictCard({ status, label, observed, fix }: { status: "good" | "close" | "off"; label: string; observed: string; fix?: string }) {
  const rail = { good: "bg-herb", close: "bg-saffron", off: "bg-brick" }[status];
  return (
    <div className="flex gap-3 rounded-2xl border border-whisper bg-raised p-4">
      <span className={`w-1 shrink-0 rounded-full ${rail}`} />
      <div>
        <p className="text-meta uppercase tracking-[0.08em] text-stone">{label}</p>
        <p className="text-sm text-cream">{observed}</p>
        {fix && <p className="text-sm text-stone">fix → {fix}</p>}
      </div>
    </div>
  );
}

function HeartbeatDemo() {
  return (
    <div className="flex gap-3 rounded-2xl border border-whisper bg-raised p-4">
      <span className="w-1 shrink-0 rounded-full bg-saffron" />
      <div>
        <p className="font-mono text-xs text-stone">03:00</p>
        <p className="text-sm text-cream">Bare bubble or rolling boil?</p>
      </div>
      <Note>
        Slides up above the bottom controls. 4px Saffron rail, mono elapsed timestamp, ≤ 20 words.
        Auto-dismisses on step advance; never stacks more than one.
      </Note>
    </div>
  );
}

function InputsDemo() {
  return (
    <div className="max-w-sm space-y-4">
      <div>
        <label htmlFor="ds-url" className="mb-1.5 block text-meta uppercase tracking-[0.08em] text-stone">
          Recipe URL
        </label>
        <input
          id="ds-url"
          className="h-14 w-full rounded-xl border border-whisper bg-raised px-4 text-cream outline-none placeholder:text-stone focus-visible:outline-2 focus-visible:outline-ember"
          placeholder="https://… or paste text below"
        />
        <p className="mt-1.5 text-sm text-stone">Helper text goes below the field.</p>
      </div>
      <div>
        <label htmlFor="ds-text" className="mb-1.5 block text-meta uppercase tracking-[0.08em] text-stone">
          Recipe text
        </label>
        <input
          id="ds-text"
          className="h-14 w-full rounded-xl border border-brick bg-raised px-4 text-cream outline-none focus-visible:outline-2 focus-visible:outline-ember"
          defaultValue="Spaghett carbonnara"
        />
        <p className="mt-1.5 text-sm text-brick">Could not parse that — check the pasted text.</p>
      </div>
      <Note>
        Label above, helper below, error below in Brick Red. Focus ring = Ember at 2px (
        focus-visible only). No floating labels.
      </Note>
    </div>
  );
}

/* ————————— Page ————————— */

const ANTI = [
  "No emoji anywhere — line icons only",
  "No Inter, no serif fonts, no pure black",
  "No violet/indigo “AI” accent — Ember is the only accent",
  "No neon glows, gradient text, glassmorphism",
  "No skeuomorphic kitchen chrome (flip clocks, chef hats)",
  "No centered hero / landing-marketing sections",
  "No 3-column equal card grids, no calc() percentage hacks",
  "No fake metrics — unknown data renders as [metric]",
  "No bouncing chevrons or filler UI text",
  "No overlapping elements — every element owns a clean zone",
  "No AI copy clichés — Jacques speaks like a line cook: imperative, short, concrete",
];

export default function DesignSystemPage() {
  return (
    <main className="mx-auto max-w-[44rem] px-6 pb-24">
      <header className="sticky top-0 z-10 -mx-6 border-b border-whisper bg-cast/85 px-6 py-3 backdrop-blur">
        <nav aria-label="Design system sections" className="flex items-center justify-center gap-6 text-sm">
          <span className="font-bold">Jacques</span>
          <a href="#color" className="text-stone hover:text-ember">Color</a>
          <a href="#type" className="text-stone hover:text-ember">Type</a>
          <a href="#components" className="text-stone hover:text-ember">Components</a>
          <a href="#motion" className="text-stone hover:text-ember">Motion</a>
        </nav>
      </header>

      <div className="py-12">
        <Meta>Design system · locked in DESIGN.md</Meta>
        <h1 className="text-step-title font-bold tracking-[-0.02em]">
          A headlamp-lit kitchen counter at night
        </h1>
        <p className="mt-4 max-w-[65ch] text-step-detail leading-[1.55] text-cream/90">
          Deep warm charcoal, one ember accent, type readable from three feet away. Density is low by
          design; motion is gentle and perpetual. This page is the living reference — every token
          below is the same token the app consumes.
        </p>
      </div>

      <Section id="color" title="Color">
        <Meta>Base palette</Meta>
        <ul className="grid gap-3 sm:grid-cols-2">
          {BASE_HUES.map((c) => (
            <Swatch key={c.token} {...c} />
          ))}
        </ul>
        <div className="h-6" />
        <Meta>Accent</Meta>
        <ul className="grid gap-3 sm:grid-cols-2">
          <Swatch token="ember" name="Ember Orange" hex="#DE6B3F" role="CTAs, current step, timer ring, focus rings — nothing else may use it" />
        </ul>
        <div className="h-6" />
        <Meta>Status (semantic only — never buttons)</Meta>
        <ul className="grid gap-3 sm:grid-cols-2">
          {STATUS.map((c) => (
            <Swatch key={c.token} {...c} />
          ))}
        </ul>
        <Note>Never pure black; never cool grays on one screen and warm on another.</Note>
      </Section>

      <Section id="type" title="Typography">
        <ul>
          <TypeRow label="Step title — clamp(2rem, 7vw, 3.25rem) · 700 · −0.02em">
            <p className="text-step-title font-bold tracking-[-0.02em]">Simmer, barely bubbling</p>
          </TypeRow>
          <TypeRow label="Step detail — clamp(1.25rem, 3.5vw, 1.5rem) · 400 · 1.55 · max 65ch">
            <p className="max-w-[65ch] text-step-detail leading-[1.55]">
              Keep the surface at a lazy shimmer — lazy bubbles, no rolling boil.
            </p>
          </TypeRow>
          <TypeRow label="Body — 1rem · 400/500">
            <p className="text-base">
              Outfit everywhere: friendly enough to coach, clean enough to carry instructions.
            </p>
          </TypeRow>
          <TypeRow label="Meta label — 0.875rem · uppercase · tracking 0.08em · Stone">
            <p className="text-meta uppercase tracking-[0.08em] text-stone">doneWhen · prep · mise en place</p>
          </TypeRow>
          <TypeRow label="Mono — JetBrains Mono · tabular figures · clocks & quantities only">
            <p className="font-mono text-2xl [font-feature-settings:'tnum']">08:35:12 · 450g · 3 / 9</p>
          </TypeRow>
        </ul>
        <Note>
          Banned: Inter (default AI slop), all serif fonts, sub-1rem body text, all-caps for anything
          except meta labels. Headings are always roman — never italic.
        </Note>
      </Section>

      <Section id="components" title="Components">
        <Meta>Buttons — pill, 56px min height, 24px padding</Meta>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={btnPrimary}>Start cooking</button>
          <button type="button" className={btnSecondary}>Back</button>
          <button type="button" className={btnDestructive}>Discard plan</button>
        </div>
        <Meta>States (forced)</Meta>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={btnPrimary} data-s="hover">hover</button>
          <button type="button" className={btnPrimary} data-s="focus">focus</button>
          <button type="button" className={btnPrimary} disabled>disabled</button>
        </div>
        <Note>
          Primary = Ember fill + Cast Iron text. Secondary = ghost outline (Whisper). Destructive =
          Brick outline, never fill. Active = tactile −1px translate + 5% darken. No glows, no
          gradients.
        </Note>

        <p className="mt-10" />
        <Meta>StepCard — one skeleton for all six StepKinds</Meta>
        <StepCardDemo />
        <div className="mt-4 flex flex-wrap gap-2">
          {STEPKINDS.map((k) => (
            <KindChip key={k} kind={k} />
          ))}
        </div>

        <p className="mt-10" />
        <Meta>Timeline — progress rail</Meta>
        <TimelineDemo />

        <p className="mt-10" />
        <Meta>QuestionCards — exactly 3 per step</Meta>
        <QuestionCardsDemo />

        <p className="mt-10" />
        <Meta>Timer — mono digits · conic Ember ring · Saffron in final 10s</Meta>
        <div className="flex flex-wrap items-center gap-8">
          <TimerDemo t="08:35" />
          <TimerDemo t="00:08" final />
        </div>
        <Note>
          JetBrains Mono digits at clamp(3rem, 12vw, 5rem). Final 10s flips digits + ring to Saffron
          with a slow pulse. No alarm-chrome, no flip-clock skeuomorphism.
        </Note>

        <p className="mt-10" />
        <Meta>ImagePanel — skeleton and composed empty state</Meta>
        <ImagePanelDemo />

        <p className="mt-10" />
        <Meta>CameraCapture</Meta>
        <button type="button" className={btnPrimary}>
          <Icon name="camera" /> Check your work
        </button>
        <Note>
          Ember fill + camera line icon. Uses file input capture — no getUserMedia plumbing.
        </Note>

        <p className="mt-10" />
        <Meta>VerdictCard — status by 4px rail, not elevation</Meta>
        <div className="space-y-3">
          <VerdictCard status="good" label="good" observed="Dice is even — matches the reference cut." />
          <VerdictCard status="close" label="close" observed="A few chunks larger than the rest." fix="Scoop the big pieces back to the board and re-cut them." />
          <VerdictCard status="off" label="off" observed="Slices, not dice — and the root end is still on." fix="Split the onion through the root, then dice across the halves." />
        </div>

        <p className="mt-10" />
        <Meta>HeartbeatToast</Meta>
        <HeartbeatDemo />

        <p className="mt-10" />
        <Meta>Inputs</Meta>
        <InputsDemo />
      </Section>

      <Section id="layout" title="Layout">
        <ul className="list-none space-y-2 text-sm text-cream/90">
          <li>Portrait-first, single column always — desktop only widens the centered column toward 640px.</li>
          <li>Full step screens via min-h-[100dvh]; PWA chrome pads env(safe-area-inset-*) on all four edges.</li>
          <li>Walkthrough skeleton: timeline rail → scrollable middle → question cards → fixed bottom controls.</li>
          <li>Touch targets ≥ 56px; ≥ 12px gaps between adjacent targets — wet-thumb forgiveness.</li>
          <li>Whitespace separates. Borders and spacing structure the page — no shadows, no overlap.</li>
        </ul>
      </Section>

      <Section id="motion" title="Motion">
        <ul className="space-y-2 text-sm text-cream/90">
          <li>Spring physics: stiffness 100, damping 20 (CSS fallback: ease-jacques). No linear easing, no bounce.</li>
          <li>Perpetual micro-loops on live elements only: ring sweep, ember pulse, image shimmer, mic float.</li>
          <li>Step mount cascades title → detail → image → cards on 60ms offsets — never pop all at once.</li>
          <li>Transform and opacity only — never animate width, height, top, left.</li>
          <li>Verdict/heartbeat entries slide up + fade (translateY 8px → 0), exit by collapse.</li>
          <li>prefers-reduced-motion: reduce — loops collapse to opacity-only.</li>
        </ul>
        <Note>
          Motion tokens: --ease-jacques, --dur-step-cascade (60ms), --dur-verdict (220ms). Loops ship
          in tokens.css as .shimmer / .pulse-ember / .pulse-amber, gated behind no-preference.
        </Note>
      </Section>

      <Section id="anti" title="Anti-patterns">
        <ul className="grid gap-2 sm:grid-cols-2">
          {ANTI.map((a) => (
            <li key={a} className="rounded-xl border border-whisper bg-raised/50 px-4 py-3 text-sm text-stone">
              {a}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="usage" title="Usage">
        <pre className="overflow-x-auto rounded-2xl border border-whisper bg-raised p-4 font-mono text-xs text-cream/90">
{`bg-cast text-cream
border border-whisper rounded-card bg-raised
bg-ember text-cast          — primary CTA
text-stone                  — secondary copy
bg-herb / bg-saffron / bg-brick — status only
font-mono [font-feature-settings:'tnum'] — clocks & quantities
text-step-title / text-step-detail / text-meta — locked scale`}
        </pre>
        <Note>
          Tokens live in src/app/tokens.css and are regression-checked by design-system.spec.
          Change a token by changing DESIGN.md first, then the token — never the reverse.
        </Note>
      </Section>

      <footer className="mt-16 border-t border-whisper pt-6 text-sm text-stone">
        Jacques design system · locked in <code className="font-mono">DESIGN.md</code>. This page is a
        living reference: tokens, type, components, motion, and the bans.
      </footer>
    </main>
  );
}
