"use client";

import { useEffect, useRef, useState } from "react";
import fixturePlan from "@/fixtures/plan.carbonara.json";
import { fixtureAnswerChunks, fixtureVerdict } from "@/lib/fixture-responses";
import { useFlags } from "@/lib/glue/app-bootstrap";
import { useStore } from "@/lib/store";
import type { AnswerCard, RecipePlan } from "@/lib/types";

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

  // A step change or repeat() invalidates any in-flight simulated answer stream and clears
  // the locally-expanded question, matching the same `generation` invalidation the timer uses.
  useEffect(() => {
    setActiveQuestion(undefined);
    streamGeneration.current += 1;
  }, [currentStep?.id, generation]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!storePlan) return;
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
        useStore
          .getState()
          .setAnswer({ kind: "answer", stepId, question, text, streaming: true });
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
  const latestVerdict = cards.findLast((card) => card.kind === "verdict");
  const latestHeartbeat = cards.findLast(
    (card) => card.kind === "heartbeat" && card.stepId === currentStep.id,
  );

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
        onToggleTimer={() => {
          if (activeTimer) useStore.getState().cancelTimer();
          else if (currentStep.durationSec) useStore.getState().startTimer(currentStep.durationSec);
        }}
        timerActive={activeTimer !== undefined}
        timerDisabled={activeTimer === undefined && currentStep.durationSec === undefined}
        novoice={flags.novoice}
        camera={<CameraCapture onCapture={flags.fixture ? undefined : handleCapture} />}
      />
    </AppShell>
  );
}
