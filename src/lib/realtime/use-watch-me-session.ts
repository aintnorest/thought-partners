"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import type { RecipePlan, Step } from "@/lib/types";

export const WATCH_SAMPLE_INTERVAL_MS = 1500;

const AUDIO_MIME_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];

type CameraStartMode = { camera?: boolean };

type AudioContextConstructor = typeof AudioContext;

export type WatchStatus = "idle" | "starting" | "watching" | "coach" | "ready" | "error";
export type MicStatus = "idle" | "disabled" | "requesting" | "listening" | "unavailable" | "error";
export type CameraStatus = "idle" | "requesting" | "ready" | "unavailable" | "error";

export interface WatchSessionState {
  active: boolean;
  status: WatchStatus;
  micStatus: MicStatus;
  cameraStatus: CameraStatus;
  micLevel: number;
  lastMessage?: string;
  lastAckAt?: number;
  error?: string;
}

export interface UseWatchMeSessionArgs {
  enabled: boolean;
  voiceEnabled: boolean;
  plan?: RecipePlan;
  step?: Step;
}

export interface WatchMeSession extends WatchSessionState {
  videoRef: RefObject<HTMLVideoElement | null>;
  start(options?: CameraStartMode): Promise<void>;
  stop(): void;
  captureFrame(): void;
}

function initialState(): WatchSessionState {
  return {
    active: false,
    status: "idle",
    micStatus: "idle",
    cameraStatus: "idle",
    micLevel: 0,
  };
}

export function pickAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  if (typeof MediaRecorder.isTypeSupported !== "function") return "";

  return AUDIO_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? "";
}

export function isWatchableStep(step: Step | undefined): boolean {
  if (!step?.doneWhen) return false;
  return ["prep", "heat", "wait", "combine", "check"].includes(step.kind);
}

function unavailable(message: string): WatchSessionState {
  return {
    ...initialState(),
    status: "error",
    micStatus: "unavailable",
    cameraStatus: "unavailable",
    lastMessage: message,
    error: message,
  };
}

function audioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  );
}

export function useWatchMeSession({
  enabled,
  plan,
  step,
  voiceEnabled,
}: UseWatchMeSessionArgs): WatchMeSession {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserIntervalRef = useRef<number | undefined>(undefined);
  const frameIntervalRef = useRef<number | undefined>(undefined);
  const activeRef = useRef(false);
  const pendingPostsRef = useRef<Set<AbortController>>(new Set());
  const [state, setState] = useState<WatchSessionState>(initialState);

  const postRealtime = useCallback(
    async (payload: { audio?: Blob; image?: Blob; source: "audio" | "frame" }) => {
      if (!plan || !step || !activeRef.current) return;

      const form = new FormData();
      form.set("plan", JSON.stringify(plan));
      form.set("stepId", step.id);
      form.set("source", payload.source);

      if (payload.audio) {
        form.set("audio", payload.audio, "watch-audio.webm");
      }
      if (payload.image) {
        form.set("image", payload.image, "watch-frame.jpg");
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      pendingPostsRef.current.add(controller);

      try {
        const response = await fetch("/api/realtime", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });

        if (!response.ok) {
          setState((current) => ({
            ...current,
            lastMessage: "Realtime proxy rejected the latest mic/frame chunk.",
          }));
          return;
        }

        await response.text();
        setState((current) => ({
          ...current,
          lastAckAt: Date.now(),
          lastMessage: current.lastMessage ?? "Mic and camera stream connected.",
        }));
      } catch {
        if (!controller.signal.aborted) {
          setState((current) => ({
            ...current,
            lastMessage: "Realtime proxy is unavailable; local mic check is still live.",
          }));
        }
      } finally {
        window.clearTimeout(timeout);
        pendingPostsRef.current.delete(controller);
      }
    },
    [plan, step],
  );

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !activeRef.current)
      return;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob && activeRef.current) void postRealtime({ image: blob, source: "frame" });
      },
      "image/jpeg",
      0.68,
    );
  }, [postRealtime]);

  const stop = useCallback(() => {
    const hadLiveMedia =
      activeRef.current || cameraStreamRef.current !== null || micStreamRef.current !== null;
    activeRef.current = false;

    if (frameIntervalRef.current !== undefined) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = undefined;
    }
    if (analyserIntervalRef.current !== undefined) {
      window.clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = undefined;
    }

    for (const controller of pendingPostsRef.current) controller.abort();
    pendingPostsRef.current.clear();

    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    recorderRef.current = null;

    cameraStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    micStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    cameraStreamRef.current = null;
    micStreamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;

    void audioContextRef.current?.close();
    audioContextRef.current = null;

    setState({
      ...initialState(),
      lastMessage: hadLiveMedia ? "Watch Me stopped. Mic and camera are off." : undefined,
    });
  }, []);

  const startMicrophone = useCallback(async () => {
    if (!voiceEnabled) {
      setState((current) => ({ ...current, micStatus: "disabled" }));
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setState((current) => ({
        ...current,
        micStatus: "unavailable",
        lastMessage: "This browser cannot request the microphone.",
      }));
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setState((current) => ({
        ...current,
        micStatus: "unavailable",
        lastMessage: "This browser cannot stream microphone chunks.",
      }));
      return;
    }

    setState((current) => ({ ...current, micStatus: "requesting" }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      micStreamRef.current = stream;

      const AudioContextCtor = audioContextConstructor();
      if (AudioContextCtor) {
        const audioContext = new AudioContextCtor();
        audioContextRef.current = audioContext;
        if (audioContext.state === "suspended") await audioContext.resume();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const samples = new Uint8Array(analyser.frequencyBinCount);
        analyserIntervalRef.current = window.setInterval(() => {
          analyser.getByteTimeDomainData(samples);
          let sum = 0;
          for (const sample of samples) {
            const centered = sample - 128;
            sum += centered * centered;
          }
          const rms = Math.sqrt(sum / samples.length) / 128;
          setState((current) => ({ ...current, micLevel: Math.min(1, rms * 4) }));
        }, 200);
      }

      const mimeType = pickAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && activeRef.current)
          void postRealtime({ audio: event.data, source: "audio" });
      };
      recorder.onerror = () => {
        setState((current) => ({
          ...current,
          micStatus: "error",
          status: "error",
          error: "Microphone recorder failed.",
          lastMessage: "Microphone recorder failed.",
        }));
      };
      recorder.start(WATCH_SAMPLE_INTERVAL_MS);

      setState((current) => ({
        ...current,
        micStatus: "listening",
        lastMessage: "Mic is available and listening.",
      }));
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "NotAllowedError"
          ? "Microphone permission was denied. Enable it in browser settings, then tap Watch Me again."
          : "Microphone unavailable. Camera Watch Me can still run without voice.";
      setState((current) => ({
        ...current,
        micStatus: "error",
        lastMessage: message,
        error: message,
      }));
    }
  }, [postRealtime, voiceEnabled]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState((current) => ({ ...current, cameraStatus: "unavailable" }));
      return false;
    }

    setState((current) => ({ ...current, cameraStatus: "requesting" }));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState((current) => ({ ...current, cameraStatus: "ready" }));
      frameIntervalRef.current = window.setInterval(captureFrame, WATCH_SAMPLE_INTERVAL_MS);
      window.setTimeout(captureFrame, 500);
      return true;
    } catch {
      setState((current) => ({
        ...current,
        cameraStatus: "error",
        lastMessage: "Camera unavailable. Jacques can still listen by mic.",
      }));
      return false;
    }
  }, [captureFrame]);

  const start = useCallback(
    async ({ camera = true }: CameraStartMode = {}) => {
      if (!enabled) {
        setState(unavailable("Watch Me is disabled by ?nowatch=1."));
        return;
      }
      if (!plan || !step) {
        setState(unavailable("Load a recipe step before starting Watch Me."));
        return;
      }

      stop();
      activeRef.current = true;
      setState({
        ...initialState(),
        active: true,
        status: "starting",
        lastMessage: voiceEnabled
          ? "Requesting camera and microphone."
          : "Requesting camera. Voice is disabled.",
      });

      const cameraReady = camera ? await startCamera() : false;
      await startMicrophone();

      if (!activeRef.current) return;
      const micLive = recorderRef.current?.state === "recording";
      const hasMedia = cameraReady || micLive;

      setState((current) => ({
        ...current,
        active: hasMedia,
        status: hasMedia ? "watching" : "error",
        lastMessage: hasMedia
          ? (current.lastMessage ?? "Jacques will stay quiet unless something needs attention.")
          : "Neither camera nor microphone could start.",
      }));
    },
    [enabled, plan, startCamera, startMicrophone, step, stop, voiceEnabled],
  );

  useEffect(() => stop, [stop]);

  return { ...state, videoRef, start, stop, captureFrame };
}
