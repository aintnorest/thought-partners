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
    const reader = result.fullStream.getReader();
    let firstText = "";

    while (firstText.length === 0) {
      const { done, value: part } = await reader.read();
      if (done) {
        console.error("Answer stream ended before producing text");
        return Response.json({ error: "answer unavailable" }, { status: 502 });
      }
      if (part.type === "error") {
        console.error("Failed to start answer stream", part.error);
        return Response.json({ error: "answer unavailable" }, { status: 502 });
      }
      if (part.type === "text-delta") {
        firstText += part.text;
      }
    }

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(firstText));
          while (true) {
            const { done, value: part } = await reader.read();
            if (done || part.type === "error") {
              controller.close();
              return;
            }
            if (part.type === "text-delta") {
              controller.enqueue(encoder.encode(part.text));
            }
          }
        },
      }),
      { headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  } catch (error) {
    console.error("Failed to start answer stream", error);
    return Response.json({ error: "answer unavailable" }, { status: 502 });
  }
}
