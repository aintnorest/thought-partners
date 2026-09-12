"use client";

import { useEffect, useRef, useState } from "react";
import { AnswerPanel } from "@/components/answer-panel";
import { AppShell } from "@/components/app-shell";
import { CameraCapture } from "@/components/camera-capture";
import { ControlCluster } from "@/components/control-cluster";
import { HeartbeatToast } from "@/components/heartbeat-toast";
import { ImagePanel } from "@/components/image-panel";
import { ImportForm } from "@/components/import-form";
import { QuestionCards } from "@/components/question-cards";
import { StepCard } from "@/components/step-card";
import { Timeline } from "@/components/timeline";
import { Timer } from "@/components/timer";
import { VerdictCard } from "@/components/verdict-card";
import fixturePlan from "@/fixtures/plan.carbonara.json";
import { fixtureAnswerChunks, fixtureVerdict } from "@/lib/fixture-responses";
import { useFlags } from "@/lib/glue/app-bootstrap";
import { isWatchableStep, useWatchMeSession } from "@/lib/realtime/use-watch-me-session";
import { useStore } from "@/lib/store";
import type { AnswerCard, RecipePlan, Step, WatchFixCard, WatchReadyCard } from "@/lib/types";

function WatchMePanel({ step }: { step: Step }) {
  const flags = useFlags();
  const plan = useStore((state) => state.plan);
  const watchActive = useStore((state) => state.watch.active);
  const startWatch = useStore((state) => state.startWatch);
  const stopWatch = useStore((state) => state.stopWatch);
  const showFix = useStore((state) => state.showFix);
  const markStepReady = useStore((state) => state.markStepReady);
  const session = useWatchMeSession({
    enabled: !flags.nowatch,
    voiceEnabled: !flags.novoice,
    offline: flags.fixture,
    plan,
    step,
  });

  useEffect(() => {
    if (session.active === watchActive) return;
    if (session.active) startWatch();
    else stopWatch();
  }, [session.active, watchActive, startWatch, stopWatch]);

  useEffect(() => () => stopWatch(), [stopWatch]);

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

  function handleStart() {
    void session.start({ camera: true });
  }

  return (
    <section
      id="watch-me"
      className="rounded-card border border-whisper bg-raised p-4"
      aria-label="Watch Me media capture check"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">Watch Me</p>
          <p className="mt-1 text-xl font-semibold text-cream">
            {flags.novoice ? "Check camera capture." : "Check camera and microphone capture."}
          </p>
        </div>
        {session.active ? (
          <span className="inline-flex items-center gap-2 rounded-pill border border-whisper px-3 py-2 text-sm text-stone">
            <span className="h-2.5 w-2.5 rounded-full bg-ember pulse-ember" /> Sampling
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-stone">
        {flags.fixture
          ? "Offline fixture: media stays on this device. No uploads or AI analysis."
          : "Captured media is sent to a receipt endpoint only. It does not interpret cooking, answer questions, or generate voice replies."}
      </p>

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
          Recipe cue — check this yourself
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
              ? "Microphone disabled"
              : session.micStatus === "listening"
                ? "Capturing microphone input"
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
          <p className="mt-2 text-stone">
            {flags.fixture
              ? "Local preview only. Frames are not uploaded."
              : "While active, camera frames are sent about every 1.5s."}
          </p>
        </div>
      </div>

      {session.lastMessage ? (
        <div className="mt-4 rounded-card border border-l-4 border-l-saffron border-whisper bg-cast p-4">
          <p className="text-meta font-semibold uppercase tracking-[0.08em] text-stone">
            Capture status
          </p>
          <p className="mt-2 text-lg text-cream">{session.lastMessage}</p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {session.active || session.status === "starting" ? (
          <button
            className="min-h-14 rounded-pill border border-brick px-6 text-brick"
            onClick={session.stop}
            type="button"
          >
            {session.status === "starting" ? "Cancel capture" : "Stop capture"}
          </button>
        ) : (
          <button
            className="min-h-14 rounded-pill bg-ember px-6 font-semibold text-cast"
            onClick={handleStart}
            type="button"
          >
            Start capture
          </button>
        )}
        {!flags.fixture ? (
          <button
            className="min-h-14 rounded-pill border border-whisper px-6 text-cream disabled:text-stone"
            disabled={!session.active || session.cameraStatus !== "ready"}
            onClick={session.captureFrame}
            type="button"
          >
            Send frame now
          </button>
        ) : null}
      </div>
      {flags.fixture ? (
        <div className="mt-4 border-t border-whisper pt-4">
          <p className="text-sm text-stone">
            Fixture examples only — these cards are scripted, not model output. Start capture to try
            them.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              className="min-h-14 rounded-pill border border-whisper px-6 text-cream disabled:text-stone"
              disabled={!session.active}
              onClick={() => showFix("Lower heat one notch and stir for ten seconds.")}
              type="button"
            >
              Demo fix
            </button>
            <button
              className="min-h-14 rounded-pill border border-whisper px-6 text-cream disabled:text-stone"
              disabled={!session.active}
              onClick={() => markStepReady(step.doneWhen ?? "Looks ready.")}
              type="button"
            >
              Demo ready
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

const plan = fixturePlan as RecipePlan;
const OFFLINE_QA_MESSAGE = "Offline demo — Q&A needs a connection.";
const STREAM_CHUNK_DELAY_MS = 90;

export default function Home() {
  const flags = useFlags();
  const storePlan = useStore((s) => s.plan);
  const stepIndex = useStore((s) => s.stepIndex);
  const generation = useStore((s) => s.generation);
  const cards = useStore((s) => s.cards);
  const activeTimer = useStore((s) => s.activeTimer);

  const [activeQuestion, setActiveQuestion] = useState<string | undefined>();
  const streamGeneration = useRef(0);

  const currentStep = storePlan?.steps[stepIndex];
  const showWatchMe = !flags.nowatch && isWatchableStep(currentStep);

  // Cancel the sample stream synchronously when navigation/repeat invalidates its context.
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state, previous) => {
      if (
        state.plan !== previous.plan ||
        state.stepIndex !== previous.stepIndex ||
        state.generation !== previous.generation
      ) {
        setActiveQuestion(undefined);
        streamGeneration.current += 1;
      }
    });
    return () => {
      unsubscribe();
      streamGeneration.current += 1;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!storePlan || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        useStore.getState().next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        useStore.getState().prev();
      } else if (event.key === "r") {
        event.preventDefault();
        useStore.getState().repeat();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [storePlan]);

  if (!storePlan || !currentStep) {
    return (
      <AppShell>
        <main className="flex flex-1 flex-col gap-8 px-4 py-10">
          <h1 className="text-[clamp(2rem,7vw,3.25rem)] font-bold tracking-[-0.02em] text-warm-off-white">
            Jacques
          </h1>
          <ImportForm
            onSubmit={() => useStore.getState().setPlan(plan)}
            onUseSample={() => useStore.getState().setPlan(plan)}
          />
        </main>
      </AppShell>
    );
  }

  function handleAsk(question: string) {
    setActiveQuestion(question);
    if (flags.fixture || !currentStep) return;

    const stepId = currentStep.id;
    const myStreamGen = ++streamGeneration.current;
    const chunks = fixtureAnswerChunks(storePlan as RecipePlan, currentStep, question);

    (async () => {
      let text = "";
      for (const chunk of chunks) {
        const { promise, resolve } = Promise.withResolvers<void>();
        setTimeout(resolve, STREAM_CHUNK_DELAY_MS);
        await promise;
        if (streamGeneration.current !== myStreamGen) return;

        text = text ? `${text} ${chunk}` : chunk;
        useStore.getState().setAnswer({ kind: "answer", stepId, question, text, streaming: true });
      }
      if (streamGeneration.current !== myStreamGen) return;
      useStore.getState().setAnswer({ kind: "answer", stepId, question, text, streaming: false });
    })();
  }

  function handleCapture() {
    if (!currentStep) return;
    const verdict = fixtureVerdict(currentStep);
    useStore.getState().pushCard({ kind: "verdict", stepId: currentStep.id, verdict });
  }

  const latestAnswer = flags.fixture
    ? undefined
    : cards.findLast(
        (card): card is AnswerCard => card.kind === "answer" && card.stepId === currentStep.id,
      );
  const latestVerdict = cards.findLast(
    (card) => card.kind === "verdict" && card.stepId === currentStep.id,
  );
  const latestHeartbeat = cards.findLast(
    (card) => card.kind === "heartbeat" && card.stepId === currentStep.id,
  );
  const watchCards = flags.fixture
    ? cards.filter(
        (card): card is WatchFixCard | WatchReadyCard =>
          (card.kind === "watch_fix" || card.kind === "watch_ready") &&
          card.stepId === currentStep.id,
      )
    : [];

  return (
    <AppShell>
      <Timeline
        steps={storePlan.steps}
        currentIndex={stepIndex}
        onSelect={(i) => useStore.getState().goto(i)}
      />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-56">
        <StepCard step={currentStep} />
        <ImagePanel
          imageUrl={currentStep.imageUrl}
          alt={currentStep.title}
          hidden={flags.noimages}
        />
        {currentStep.durationSec !== undefined && <Timer />}

        {!flags.fixture && (
          <p className="text-stone-gray">
            Sample walkthrough: answers and photo verdicts are scripted examples, not AI analysis.
          </p>
        )}

        <QuestionCards
          questions={currentStep.questions}
          activeQuestion={activeQuestion}
          onSelect={handleAsk}
          cascadeKey={`${currentStep.id}:${generation}`}
        />
        {activeQuestion && (
          <AnswerPanel
            card={latestAnswer}
            offlineMessage={flags.fixture ? OFFLINE_QA_MESSAGE : undefined}
          />
        )}
        {watchCards.length > 0 && (
          <section className="space-y-3" aria-label="Step notices">
            {watchCards.map((card) => (
              <div
                key={`${card.kind}-${card.stepId}`}
                className={`rounded-3xl border border-whisper-warm border-l-4 bg-raised-charcoal p-4 ${
                  card.kind === "watch_ready"
                    ? "border-l-herb"
                    : card.level === "high"
                      ? "border-l-brick"
                      : "border-l-saffron"
                }`}
              >
                <p className="text-sm uppercase tracking-[0.08em] text-stone-gray">
                  {card.kind === "watch_ready" ? "Fixture example: ready" : "Fixture example: fix"}
                </p>
                <p className="mt-2 text-lg text-warm-off-white">{card.line}</p>
              </div>
            ))}
          </section>
        )}
        {showWatchMe && (
          <WatchMePanel key={`${storePlan.id}:${currentStep.id}`} step={currentStep} />
        )}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-[164px] z-20 mx-auto flex w-full max-w-[640px] flex-col gap-3 px-4">
        <div className="pointer-events-auto flex flex-col gap-3">
          {latestVerdict?.kind === "verdict" && (
            <VerdictCard
              card={latestVerdict}
              onDismiss={() =>
                useStore.setState((state) => ({
                  cards: state.cards.filter((c) => c !== latestVerdict),
                }))
              }
            />
          )}
          {latestHeartbeat?.kind === "heartbeat" && <HeartbeatToast card={latestHeartbeat} />}
        </div>
      </div>

      <ControlCluster
        onPrev={() => useStore.getState().prev()}
        onNext={() => useStore.getState().next()}
        prevDisabled={stepIndex === 0}
        nextDisabled={stepIndex === storePlan.steps.length - 1}
        onToggleTimer={() => {
          if (activeTimer) useStore.getState().cancelTimer();
          else if (currentStep.durationSec) useStore.getState().startTimer(currentStep.durationSec);
        }}
        timerActive={activeTimer !== undefined}
        timerDisabled={activeTimer === undefined && currentStep.durationSec === undefined}
        novoice={flags.novoice}
        onMic={
          showWatchMe
            ? () => document.getElementById("watch-me")?.scrollIntoView({ block: "start" })
            : undefined
        }
        camera={<CameraCapture onCapture={flags.fixture ? undefined : handleCapture} />}
      />
    </AppShell>
  );
}
