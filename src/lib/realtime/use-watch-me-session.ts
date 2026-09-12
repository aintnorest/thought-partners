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
  offline?: boolean;
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
  offline = false,
}: UseWatchMeSessionArgs): WatchMeSession {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserIntervalRef = useRef<number | undefined>(undefined);
  const frameIntervalRef = useRef<number | undefined>(undefined);
  const activeRef = useRef(false);
  // A boolean alone cannot distinguish a stopped session from a later restart.
  const sessionRef = useRef(0);
  const pendingPostsRef = useRef<Set<AbortController>>(new Set());
  const [state, setState] = useState<WatchSessionState>(initialState);

  const isCurrent = useCallback(
    (session: number) => activeRef.current && sessionRef.current === session,
    [],
  );

  const releaseMicrophone = useCallback(() => {
    if (analyserIntervalRef.current !== undefined) {
      window.clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = undefined;
    }
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onerror = null;
      if (recorder.state !== "inactive") recorder.stop();
    }
    micStreamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    micStreamRef.current = null;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    if (context && context.state !== "closed") void context.close().catch(() => undefined);
  }, []);

  const stop = useCallback(() => {
    const hadLiveMedia = activeRef.current;
    activeRef.current = false;
    sessionRef.current += 1;
    if (frameIntervalRef.current !== undefined) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = undefined;
    }
    for (const controller of pendingPostsRef.current) controller.abort();
    pendingPostsRef.current.clear();
    releaseMicrophone();
    cameraStreamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    canvasRef.current = null;
    setState({
      ...initialState(),
      lastMessage: hadLiveMedia ? "Watch Me stopped. Mic and camera are off." : undefined,
    });
  }, [releaseMicrophone]);

  const mediaEnded = useCallback(
    (session: number) => {
      if (!isCurrent(session)) return;
      stop();
      setState({
        ...initialState(),
        status: "error",
        error: "Media capture ended. Tap Watch Me to try again.",
        lastMessage: "Media capture ended. Tap Watch Me to try again.",
      });
    },
    [isCurrent, stop],
  );

  const postRealtime = useCallback(
    async (payload: { audio?: Blob; image?: Blob; source: "audio" | "frame" }, session: number) => {
      if (offline || !plan || !step || !isCurrent(session)) return;
      const form = new FormData();
      form.set("plan", JSON.stringify(plan));
      form.set("stepId", step.id);
      form.set("source", payload.source);
      if (payload.audio) {
        const extension = payload.audio.type.includes("mp4")
          ? "mp4"
          : payload.audio.type.includes("aac")
            ? "aac"
            : "webm";
        form.set("audio", payload.audio, `watch-audio.${extension}`);
      }
      if (payload.image) form.set("image", payload.image, "watch-frame.jpg");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4_000);
      pendingPostsRef.current.add(controller);
      try {
        const response = await fetch("/api/realtime", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
        await response.text();
        if (!isCurrent(session) || controller.signal.aborted) return;
        setState((current) => ({
          ...current,
          lastAckAt: response.ok ? Date.now() : current.lastAckAt,
          lastMessage: response.ok
            ? "Server received media. Speech and visual analysis are not connected."
            : "Server rejected the latest capture. Local media check is still active.",
        }));
      } catch {
        if (isCurrent(session)) {
          setState((current) => ({
            ...current,
            lastMessage: "Media upload failed. Local media check is still active.",
          }));
        }
      } finally {
        window.clearTimeout(timeout);
        pendingPostsRef.current.delete(controller);
      }
    },
    [isCurrent, offline, plan, step],
  );

  const captureFrame = useCallback(() => {
    if (offline) return;
    const session = sessionRef.current;
    const video = videoRef.current;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !isCurrent(session))
      return;
    const canvas = canvasRef.current ?? document.createElement("canvas");
    canvasRef.current = canvas;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob && isCurrent(session))
          void postRealtime({ image: blob, source: "frame" }, session);
      },
      "image/jpeg",
      0.68,
    );
  }, [isCurrent, offline, postRealtime]);

  const startMicrophone = useCallback(
    async (session: number) => {
      if (!isCurrent(session)) return;
      if (!voiceEnabled) {
        setState((current) => ({ ...current, micStatus: "disabled" }));
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        releaseMicrophone();
        setState((current) => ({
          ...current,
          micStatus: "unavailable",
          lastMessage: "Microphone capture needs a supported browser on HTTPS or localhost.",
        }));
        return;
      }
      setState((current) => ({ ...current, micStatus: "requesting" }));
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        if (!isCurrent(session)) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          return;
        }
        micStreamRef.current = stream;
        stream.getTracks().forEach((track) => {
          track.onended = () => mediaEnded(session);
        });
        const context = audioContextRef.current;
        if (context && context.state !== "closed") {
          const source = context.createMediaStreamSource(stream);
          const analyser = context.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          const samples = new Uint8Array(analyser.frequencyBinCount);
          analyserIntervalRef.current = window.setInterval(() => {
            if (!isCurrent(session)) return;
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
          if (event.data.size > 0 && isCurrent(session))
            void postRealtime({ audio: event.data, source: "audio" }, session);
        };
        recorder.onerror = () => {
          if (!isCurrent(session)) return;
          releaseMicrophone();
          const cameraLive = cameraStreamRef.current !== null;
          activeRef.current = cameraLive;
          setState((current) => ({
            ...current,
            active: cameraLive,
            micStatus: "error",
            micLevel: 0,
            status: cameraLive ? "watching" : "error",
            error: "Microphone recorder failed.",
            lastMessage: "Microphone recorder failed.",
          }));
        };
        recorder.start(WATCH_SAMPLE_INTERVAL_MS);
        setState((current) => ({
          ...current,
          micStatus: "listening",
          lastMessage: offline
            ? "Local mic check is active. Fixture mode uploads nothing."
            : "Mic capture is active. Speech analysis is not connected.",
        }));
      } catch (error) {
        if (!isCurrent(session)) return;
        releaseMicrophone();
        const message =
          error instanceof DOMException && error.name === "NotAllowedError"
            ? "Microphone permission denied. Check browser and system privacy settings, then try again."
            : "Microphone unavailable. Camera capture can still run without voice.";
        setState((current) => ({
          ...current,
          micStatus: "error",
          error: message,
          lastMessage: message,
        }));
      }
    },
    [isCurrent, mediaEnded, offline, postRealtime, releaseMicrophone, voiceEnabled],
  );

  const startCamera = useCallback(
    async (session: number) => {
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
        if (!isCurrent(session)) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          return false;
        }
        cameraStreamRef.current = stream;
        stream.getTracks().forEach((track) => {
          track.onended = () => mediaEnded(session);
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => undefined);
        }
        setState((current) => ({
          ...current,
          cameraStatus: "ready",
          lastMessage: offline
            ? "Local camera preview is active. Fixture mode uploads nothing."
            : "Camera capture is active. Visual analysis is not connected.",
        }));
        if (!offline) {
          frameIntervalRef.current = window.setInterval(captureFrame, WATCH_SAMPLE_INTERVAL_MS);
        }
        return true;
      } catch {
        if (isCurrent(session)) {
          setState((current) => ({
            ...current,
            cameraStatus: "error",
            lastMessage: "Camera unavailable. Microphone capture can still run.",
          }));
        }
        return false;
      }
    },
    [captureFrame, isCurrent, mediaEnded, offline],
  );

  const start = useCallback(
    async ({ camera = true }: CameraStartMode = {}) => {
      stop();
      if (!enabled || !plan || !step) {
        const message = !enabled
          ? "Watch Me is disabled by ?nowatch=1."
          : "Load a recipe step before starting Watch Me.";
        setState({ ...initialState(), status: "error", error: message, lastMessage: message });
        return;
      }
      const session = sessionRef.current;
      activeRef.current = true;
      setState({
        ...initialState(),
        active: true,
        status: "starting",
        micStatus: voiceEnabled ? "idle" : "disabled",
        lastMessage: camera ? "Requesting camera access." : "Requesting microphone access.",
      });
      // Unlock in the click handler, before any permission awaits (Safari).
      if (voiceEnabled) {
        const AudioContextCtor = audioContextConstructor();
        if (AudioContextCtor) {
          try {
            const context = new AudioContextCtor();
            audioContextRef.current = context;
            void context.resume().catch(() => undefined);
          } catch {
            // The input meter is optional; recording does not require Web Audio.
          }
        }
      }
      const cameraReady = camera ? await startCamera(session) : false;
      if (!isCurrent(session)) return;
      await startMicrophone(session);
      if (!isCurrent(session)) return;
      const hasMedia = cameraReady || recorderRef.current?.state === "recording";
      activeRef.current = hasMedia;
      setState((current) => ({
        ...current,
        active: hasMedia,
        status: hasMedia ? "watching" : "error",
        lastMessage: hasMedia
          ? current.lastMessage
          : (current.error ?? "Neither camera nor microphone could start."),
      }));
    },
    [enabled, isCurrent, plan, startCamera, startMicrophone, step, stop, voiceEnabled],
  );

  useEffect(() => {
    // Stop media owned by the previous recipe, step, or kill-switch configuration.
    if (!enabled || !plan || !step || offline || !voiceEnabled) stop();
    return stop;
  }, [enabled, offline, plan, step, stop, voiceEnabled]);

  return { ...state, videoRef, start, stop, captureFrame };
}
