import { z } from "zod";
import { findStep, recipePlanSchema } from "@/lib/schemas";

const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const AUDIO_TYPES: Record<string, true> = {
  "audio/webm": true,
  "audio/mp4": true,
  "audio/aac": true,
  "audio/ogg": true,
};
const IMAGE_TYPES: Record<string, true> = {
  "image/jpeg": true,
  "image/png": true,
  "image/webp": true,
};

const realtimeRequestSchema = z.object({
  plan: z.string().min(1),
  stepId: z.string().min(1),
  source: z.enum(["audio", "frame"]),
});

function asFile(value: FormDataEntryValue | null): File | undefined {
  return value instanceof File ? value : undefined;
}

function eventStream(events: Array<{ event: string; data: unknown }>): Response {
  const body = events
    .map(({ data, event }) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    .join("");

  return new Response(body, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}

// Media receipt only: no transcription, visual assessment, or AI response is generated.
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const parsed = realtimeRequestSchema.safeParse({
    plan: form.get("plan"),
    stepId: form.get("stepId"),
    source: form.get("source"),
  });
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  let plan: unknown;
  try {
    plan = JSON.parse(parsed.data.plan);
  } catch {
    return Response.json({ error: "invalid plan" }, { status: 400 });
  }

  const planResult = recipePlanSchema.safeParse(plan);
  if (!planResult.success) {
    return Response.json({ error: "invalid plan" }, { status: 400 });
  }

  const step = findStep(planResult.data, parsed.data.stepId);
  if (!step) {
    return Response.json({ error: "unknown stepId" }, { status: 400 });
  }

  const audioEntry = form.get("audio");
  const imageEntry = form.get("image");
  const audio = asFile(audioEntry);
  const image = asFile(imageEntry);
  if ((audioEntry !== null && !audio) || (imageEntry !== null && !image)) {
    return Response.json({ error: "invalid media" }, { status: 400 });
  }
  if ((parsed.data.source === "audio" && !audio) || (parsed.data.source === "frame" && !image)) {
    return Response.json({ error: "missing source media" }, { status: 400 });
  }
  if (audio && audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "audio too large" }, { status: 400 });
  }
  if (image && image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "image too large" }, { status: 400 });
  }
  if (
    (audio && (audio.size === 0 || AUDIO_TYPES[audio.type.split(";", 1)[0].trim()] !== true)) ||
    (image && (image.size === 0 || IMAGE_TYPES[image.type.split(";", 1)[0].trim()] !== true))
  ) {
    return Response.json({ error: "invalid media" }, { status: 400 });
  }

  return eventStream([
    {
      event: "watch_ack",
      data: {
        type: "watch_ack",
        source: parsed.data.source,
        stepId: step.id,
        audio: audio
          ? {
              received: true,
              bytes: audio.size,
              type: audio.type,
            }
          : undefined,
        image: image
          ? {
              received: true,
              bytes: image.size,
              type: image.type,
              target: step.doneWhen,
            }
          : undefined,
      },
    },
  ]);
}
