import { generateText } from "ai";
import { z } from "zod";
import { MODELS } from "@/lib/models";
import { lowReasoning, openrouter } from "@/lib/openrouter";
import { buildHeartbeatPrompt, formatHeartbeatElapsed } from "@/lib/prompts/heartbeat";
import { findStep, recipePlanSchema } from "@/lib/schemas";

const heartbeatRequestSchema = z.object({
  stepId: z.string().min(1),
  elapsedSec: z.number().nonnegative(),
  plan: recipePlanSchema,
});

function limitLine(line: string): string {
  return line.trim().split(/\r?\n/, 1)[0].replace(/\s+/g, " ").split(" ").slice(0, 20).join(" ");
}

function fallbackLine(doneWhen: string | undefined, elapsedSec: number): string {
  const elapsed = formatHeartbeatElapsed(elapsedSec);
  const check = doneWhen ? `is it ${doneWhen.replace(/\.$/, "")} yet?` : "how is it looking?";

  return limitLine(`${elapsed} — ${check}`);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const parsed = heartbeatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const { elapsedSec, plan, stepId } = parsed.data;
  const step = findStep(plan, stepId);
  if (!step) {
    return Response.json({ error: "unknown stepId" }, { status: 400 });
  }

  const { prompt, system } = buildHeartbeatPrompt(step, elapsedSec);
  const fallback = fallbackLine(step.doneWhen, elapsedSec);

  try {
    const { text } = await generateText({
      model: openrouter.chat(MODELS.heartbeat),
      system,
      prompt,
      providerOptions: lowReasoning,
      abortSignal: AbortSignal.timeout(2500),
    });
    const line = limitLine(text);
    return Response.json({ line: line || fallback });
  } catch (error) {
    console.error("Heartbeat generation failed", error);
    return Response.json({ line: fallback });
  }
}
