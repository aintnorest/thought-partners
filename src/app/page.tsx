"use client";

import { useEffect, useState } from "react";
import { AnswerPanel } from "@/components/answer-panel";
import { AppShell } from "@/components/app-shell";
import { CameraCapture } from "@/components/camera-capture";
import { ControlCluster } from "@/components/control-cluster";
import { ErrorState } from "@/components/error-state";
import { HeartbeatToast } from "@/components/heartbeat-toast";
import { ImagePanel } from "@/components/image-panel";
import { ImportForm } from "@/components/import-form";
import { QuestionCards } from "@/components/question-cards";
import { StepCard } from "@/components/step-card";
import { Timeline } from "@/components/timeline";
import { Timer } from "@/components/timer";
import { VerdictCard } from "@/components/verdict-card";
import {
  selectAnswerFor,
  selectCurrentStep,
  selectHeartbeatFor,
  selectVerdictFor,
} from "@/lib/cards";
import { useFlags } from "@/lib/glue/app-bootstrap";
import type { Flags } from "@/lib/glue/flags";
import { useAgentBridge } from "@/lib/hooks/use-agent-bridge";
import { useAnswer } from "@/lib/hooks/use-answer";
import { useImportPlan } from "@/lib/hooks/use-import-plan";
import { useStepImages } from "@/lib/hooks/use-step-images";
import { useVisionCheck } from "@/lib/hooks/use-vision-check";
import { useWalkthroughControls } from "@/lib/hooks/use-walkthrough-controls";
import { isWatchableStep, useWatchMeSession } from "@/lib/realtime/use-watch-me-session";
import { useStore } from "@/lib/store";
import type {
  Step,
  VerdictCard as VerdictCardData,
  WatchFixCard,
  WatchReadyCard,
} from "@/lib/types";

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

const OFFLINE_QA_MESSAGE = "Jacques needs the network for questions — offline demo";

export default function Home() {
  const flags = useFlags();
  const plan = useStore((state) => state.plan);

  if (!plan) {
    return (
      <AppShell>
        <ImportScreen />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Walkthrough flags={flags} />
    </AppShell>
  );
}

function ImportScreen() {
  const importPlan = useImportPlan();

  return (
    <main className="flex flex-1 flex-col gap-8 px-4 py-10">
      <h1 className="text-[clamp(2rem,7vw,3.25rem)] font-bold tracking-[-0.02em] text-warm-off-white">
        Jacques
      </h1>
      <ImportForm onSubmit={importPlan.submit} onUseSample={importPlan.useSample} />
      {importPlan.state.status === "error" && (
        <ErrorState message={importPlan.state.message} onRetry={importPlan.state.retry} />
      )}
    </main>
  );
}

function Walkthrough({ flags }: { flags: Flags }) {
  useAgentBridge();
  useStepImages();
  const answer = useAnswer();
  const vision = useVisionCheck();
  const controls = useWalkthroughControls();

  const plan = useStore((state) => state.plan);
  const stepIndex = useStore((state) => state.stepIndex);
  const generation = useStore((state) => state.generation);
  const step = useStore(selectCurrentStep);
  const heartbeat = useStore(selectHeartbeatFor(step!.id));
  const verdict = useStore(selectVerdictFor(step!.id));
  const answerCard = useStore(selectAnswerFor(step!.id));
  const [dismissed, setDismissed] = useState<VerdictCardData>();
  const cards = useStore((state) => state.cards);
  const watchCards = flags.fixture
    ? cards.filter(
        (card): card is WatchFixCard | WatchReadyCard =>
          (card.kind === "watch_fix" || card.kind === "watch_ready") && card.stepId === step!.id,
      )
    : [];
  const showWatchMe = !flags.nowatch && isWatchableStep(step);

  if (!plan || !step) {
    return null;
  }

  return (
    <>
      <Timeline steps={plan.steps} currentIndex={stepIndex} onSelect={useStore.getState().goto} />

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 pb-56">
        <StepCard step={step} />
        <ImagePanel imageUrl={step.imageUrl} hidden={flags.noimages} alt={step.title} />
        {step.durationSec !== undefined && <Timer />}

        <QuestionCards
          key={generation}
          questions={step.questions}
          activeQuestion={answerCard?.question}
          onSelect={answer.ready ? answer.ask : () => {}}
          cascadeKey={controls.cascadeKey}
        />
        <AnswerPanel
          card={answerCard}
          offlineMessage={flags.fixture ? OFFLINE_QA_MESSAGE : undefined}
        />
        {answer.state.status === "error" && (
          <ErrorState message={answer.state.message} onRetry={answer.state.retry} />
        )}
        {vision.state.status === "error" && (
          <ErrorState message={vision.state.message} onRetry={vision.state.retry} />
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
        {showWatchMe && <WatchMePanel key={`${plan.id}:${step.id}`} step={step} />}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-[164px] z-20 mx-auto flex w-full max-w-[640px] flex-col gap-3 px-4">
        <div className="pointer-events-auto flex flex-col gap-3">
          {heartbeat && <HeartbeatToast card={heartbeat} />}
          {verdict && verdict !== dismissed && (
            <VerdictCard card={verdict} onDismiss={() => setDismissed(verdict)} />
          )}
        </div>
      </div>

      <ControlCluster
        onPrev={controls.onPrev}
        onNext={controls.onNext}
        onToggleTimer={controls.onToggleTimer}
        timerActive={controls.timerActive}
        timerDisabled={!controls.timerAvailable}
        novoice={flags.novoice}
        camera={<CameraCapture onCapture={flags.fixture ? undefined : vision.check} />}
      />
    </>
  );
}
