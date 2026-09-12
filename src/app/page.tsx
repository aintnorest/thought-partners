"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useFlags } from "@/lib/glue/app-bootstrap";
import { isWatchableStep, useWatchMeSession } from "@/lib/realtime/use-watch-me-session";
import { selectActiveTimer, useStore } from "@/lib/store";
import type { Card, Step } from "@/lib/types";

const KIND_LABEL: Record<Step["kind"], string> = {
  prep: "Prep",
  heat: "Heat",
  wait: "Wait",
  combine: "Combine",
  plate: "Plate",
  check: "Check",
};

function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function railClass(card: Card): string {
  if (card.kind === "watch_ready") return "border-l-herb";
  if (card.kind === "watch_fix")
    return card.level === "high" ? "border-l-brick" : "border-l-saffron";
  return "border-l-saffron";
}

function CardList({ cards, stepId }: { cards: Card[]; stepId: string }) {
  const visibleCards = cards.filter((card) => card.stepId === stepId).slice(-2);
  if (visibleCards.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="Live coaching cards">
      {visibleCards.map((card) => (
        <div
          className={`rounded-card border border-l-4 border-whisper ${railClass(card)} bg-raised p-4`}
          key={`${card.kind}-${card.stepId}-${card.line}`}
        >
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">
            {card.kind === "heartbeat"
              ? "Heartbeat"
              : card.kind === "watch_ready"
                ? "Looks ready"
                : "Watch Me"}
          </p>
          <p className="mt-2 text-lg text-cream">{card.line}</p>
        </div>
      ))}
    </section>
  );
}

function WatchMePanel({ step }: { step: Step }) {
  const flags = useFlags();
  const plan = useStore((state) => state.plan);
  const watch = useStore((state) => state.watch);
  const startWatch = useStore((state) => state.startWatch);
  const stopWatch = useStore((state) => state.stopWatch);
  const showFix = useStore((state) => state.showFix);
  const markStepReady = useStore((state) => state.markStepReady);
  const session = useWatchMeSession({
    enabled: !flags.nowatch,
    voiceEnabled: !flags.novoice,
    plan,
    step,
  });

  useEffect(() => {
    return () => {
      session.stop();
      useStore.getState().stopWatch();
    };
  }, [session.stop]);

  if (flags.nowatch || !isWatchableStep(step)) return null;

  const micTone =
    session.micStatus === "listening"
      ? "text-herb"
      : session.micStatus === "error"
        ? "text-brick"
        : "text-stone";
  const cameraTone =
    session.cameraStatus === "ready"
      ? "text-herb"
      : session.cameraStatus === "error"
        ? "text-brick"
        : "text-stone";

  async function handleStart() {
    startWatch();
    await session.start({ camera: true });
  }

  function handleStop() {
    session.stop();
    stopWatch();
  }

  return (
    <section
      id="watch-me"
      className="rounded-card border border-whisper bg-raised p-4"
      aria-label="Watch Me camera assisted coaching"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">Watch Me</p>
          <p className="mt-1 text-xl font-semibold text-cream">Jacques watches this cue.</p>
        </div>
        {session.active ? (
          <span className="inline-flex items-center gap-2 rounded-pill border border-whisper px-3 py-2 text-sm text-stone">
            <span className="h-2.5 w-2.5 rounded-full bg-ember pulse-ember" /> Sampling
          </span>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-card border border-whisper bg-cast">
        <video
          aria-label="Watch Me camera preview"
          autoPlay
          className="aspect-4/3 w-full object-cover"
          muted
          playsInline
          ref={session.videoRef}
        />
      </div>

      <div className="mt-4 rounded-card border border-whisper bg-cast p-4">
        <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">
          Watching for
        </p>
        <p className="mt-2 text-lg text-cream">{step.doneWhen}</p>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-card border border-whisper bg-cast p-3">
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">
            Microphone
          </p>
          <p className={`mt-2 font-semibold ${micTone}`}>
            {flags.novoice
              ? "Voice disabled"
              : session.micStatus === "listening"
                ? "Available and listening"
                : session.micStatus}
          </p>
          <meter
            className="mt-3 block h-2 w-full overflow-hidden rounded-pill bg-whisper [&::-moz-meter-bar]:rounded-pill [&::-moz-meter-bar]:bg-ember [&::-webkit-meter-bar]:rounded-pill [&::-webkit-meter-bar]:bg-whisper [&::-webkit-meter-optimum-value]:rounded-pill [&::-webkit-meter-optimum-value]:bg-ember"
            aria-label="Microphone input level"
            max={100}
            min={0}
            value={Math.round(session.micLevel * 100)}
          />
        </div>
        <div className="rounded-card border border-whisper bg-cast p-3">
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">Camera</p>
          <p className={`mt-2 font-semibold ${cameraTone}`}>
            {session.cameraStatus === "ready" ? "Preview live" : session.cameraStatus}
          </p>
          <p className="mt-2 text-stone">Frames post every 1.5s while active.</p>
        </div>
      </div>

      {watch.lastMessage || session.lastMessage ? (
        <div className="mt-4 rounded-card border border-l-4 border-l-saffron border-whisper bg-cast p-4">
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">Latest</p>
          <p className="mt-2 text-lg text-cream">{session.lastMessage ?? watch.lastMessage}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        {session.active ? (
          <button
            className="min-h-14 rounded-pill border border-brick px-6 text-brick"
            onClick={handleStop}
            type="button"
          >
            Stop Watch Me
          </button>
        ) : (
          <button
            className="min-h-14 rounded-pill bg-ember px-6 font-semibold text-cast"
            onClick={handleStart}
            type="button"
          >
            Watch Me
          </button>
        )}
        <button
          className="min-h-14 rounded-pill border border-whisper px-6 text-cream"
          onClick={session.captureFrame}
          type="button"
        >
          Send frame now
        </button>
        <button
          className="min-h-14 rounded-pill border border-whisper px-6 text-cream"
          onClick={() => showFix("Lower heat one notch and stir for ten seconds.")}
          type="button"
        >
          Demo fix
        </button>
        <button
          className="min-h-14 rounded-pill border border-whisper px-6 text-cream"
          onClick={() => markStepReady(step.doneWhen ?? "Looks ready.")}
          type="button"
        >
          Demo ready
        </button>
      </div>
    </section>
  );
}

export default function Home() {
  const flags = useFlags();
  const plan = useStore((state) => state.plan);
  const stepIndex = useStore((state) => state.stepIndex);
  const cards = useStore((state) => state.cards);
  const timer = useStore(selectActiveTimer);
  const next = useStore((state) => state.next);
  const prev = useStore((state) => state.prev);
  const startTimer = useStore((state) => state.startTimer);
  const step = plan?.steps[stepIndex];

  if (!plan || !step) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight text-cream sm:text-5xl">Jacques</h1>
        <p className="max-w-prose text-lg text-stone">
          Open the fixture walkthrough to exercise Watch Me, mic readiness, and camera sampling.
        </p>
        <nav className="flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
          <a className="text-ember hover:text-cream" href="/?fixture=1">
            Open fixture walkthrough
          </a>
          <a className="text-ember hover:text-cream" href="/api/health">
            API health
          </a>
        </nav>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-[640px] flex-col gap-5 px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-6">
      <header className="flex items-center gap-3">
        <nav className="flex flex-1 items-center gap-2" aria-label="Step progress">
          {plan.steps.map((candidate, index) => (
            <button
              aria-label={`Go to step ${index + 1}`}
              className={`h-3 flex-1 rounded-pill border ${index < stepIndex ? "border-herb bg-herb" : index === stepIndex ? "border-ember bg-transparent" : "border-stone/40 bg-transparent"}`}
              key={candidate.id}
              onClick={() => useStore.getState().goto(index)}
              type="button"
            />
          ))}
        </nav>
        <span className="font-mono text-sm text-stone">
          {stepIndex + 1} / {plan.steps.length}
        </span>
      </header>

      <section className="rounded-card border border-whisper bg-raised p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">
            {KIND_LABEL[step.kind]}
          </p>
          {timer ? (
            <p className="font-mono text-sm text-saffron">Timer {formatSeconds(timer.sec)}</p>
          ) : null}
        </div>
        <h1 className="mt-4 text-step-title font-bold leading-tight tracking-[-0.02em] text-cream">
          {step.title}
        </h1>
        <p className="mt-5 text-step-detail leading-[1.55] text-cream">{step.detail}</p>
        {step.doneWhen ? (
          <div className="mt-5 rounded-card border border-whisper bg-cast p-4">
            <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">
              Done when
            </p>
            <p className="mt-2 text-lg text-stone">{step.doneWhen}</p>
          </div>
        ) : null}
      </section>

      {!flags.noimages && step.imageUrl ? (
        <Image
          alt={`Instructional sketch for ${step.title}`}
          className="aspect-4/3 rounded-card border border-whisper object-cover"
          height={480}
          src={step.imageUrl}
          width={640}
        />
      ) : null}

      <div className="grid gap-3">
        {step.questions.map((question) => (
          <button
            className="min-h-14 rounded-pill border border-whisper px-5 text-left text-cream"
            key={question}
            type="button"
          >
            {question}
          </button>
        ))}
      </div>

      <CardList cards={cards} stepId={step.id} />
      <WatchMePanel key={step.id} step={step} />

      <div className="fixed inset-x-0 bottom-0 border-t border-whisper bg-cast/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur">
        <div className="mx-auto grid max-w-[640px] grid-cols-4 gap-3">
          <button
            className="min-h-14 rounded-pill border border-whisper px-3 text-cream disabled:text-stone"
            disabled={stepIndex === 0}
            onClick={prev}
            type="button"
          >
            Prev
          </button>
          <button
            className="min-h-14 rounded-pill border border-whisper px-3 font-mono text-cream"
            onClick={() => startTimer(step.durationSec ?? 60)}
            type="button"
          >
            Timer
          </button>
          <a
            className={`flex min-h-14 items-center justify-center rounded-pill border border-whisper px-3 text-center ${flags.novoice ? "text-stone" : "text-cream"}`}
            href={flags.novoice ? "?fixture=1&novoice=1" : "#watch-me"}
            aria-disabled={flags.novoice}
          >
            Mic
          </a>
          <button
            className="min-h-14 rounded-pill bg-ember px-3 font-semibold text-cast disabled:border disabled:border-whisper disabled:bg-transparent disabled:text-stone"
            disabled={stepIndex === plan.steps.length - 1}
            onClick={next}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
