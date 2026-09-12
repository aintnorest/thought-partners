import { generateObject } from "ai";
import { MODELS } from "@/lib/models";
import { lowReasoning, openrouter } from "@/lib/openrouter";
import { buildVisionPrompt } from "@/lib/prompts/vision";
import {
  findStep,
  recipePlanSchema,
  stripNulls,
  visionVerdictModelSchema,
  visionVerdictSchema,
} from "@/lib/schemas";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function invalidRequest() {
  return Response.json({ error: "invalid request" }, { status: 400 });
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return invalidRequest();
  }

  const image = form.get("image");
  const stepId = form.get("stepId");
  const serializedPlan = form.get("plan");

  if (
    image === null ||
    typeof image === "string" ||
    typeof stepId !== "string" ||
    typeof serializedPlan !== "string"
  ) {
    return invalidRequest();
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "image too large" }, { status: 400 });
  }
  if (image.size === 0 || !image.type.startsWith("image/") || stepId.length === 0) {
    return invalidRequest();
  }

  let untrustedPlan: unknown;
  try {
    untrustedPlan = JSON.parse(serializedPlan);
  } catch {
    return invalidRequest();
  }

  const parsedPlan = recipePlanSchema.safeParse(untrustedPlan);
  if (!parsedPlan.success) {
    return invalidRequest();
  }

  const step = findStep(parsedPlan.data, stepId);
  if (!step) {
    return Response.json({ error: "unknown stepId" }, { status: 400 });
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const { system, text } = buildVisionPrompt(step);

  try {
    const { object: raw } = await generateObject({
      model: openrouter.chat(MODELS.vision),
      schema: visionVerdictModelSchema,
      temperature: 0,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            { type: "image", image: bytes, mediaType: image.type },
          ],
        },
      ],
      providerOptions: lowReasoning,
    });

    return Response.json(visionVerdictSchema.parse(stripNulls(raw)));
  } catch (error) {
    console.error("Vision verdict generation failed", error);
    return Response.json({ error: "verdict unavailable" }, { status: 502 });
  }
}
