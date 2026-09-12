import { streamText } from "ai";
import { z } from "zod";
import { MODELS } from "@/lib/models";
import { lowReasoning, openrouter } from "@/lib/openrouter";
import { buildAskMessages } from "@/lib/prompts/ask";
import { findStep, recipePlanSchema } from "@/lib/schemas";

const askRequestSchema = z.object({
  planId: z.string(),
  stepId: z.string(),
  question: z.string().min(1).max(500),
  plan: recipePlanSchema,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const parsed = askRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const { plan, stepId, question } = parsed.data;
  const step = findStep(plan, stepId);
  if (!step) {
    return Response.json({ error: "unknown stepId" }, { status: 400 });
  }

  const { system, prompt } = buildAskMessages(plan, step, question);
  try {
    const result = streamText({
      model: openrouter.chat(MODELS.ask),
      system,
      prompt,
      providerOptions: lowReasoning,
    });
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Failed to start answer stream", error);
    return Response.json({ error: "answer unavailable" }, { status: 502 });
  }
}
