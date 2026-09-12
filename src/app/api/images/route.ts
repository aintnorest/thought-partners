import { z } from "zod";
import { cacheKey, getOrCreate } from "@/lib/images/cache";
import { generateTechniqueImage } from "@/lib/images/generate";

const requestSchema = z.object({
  planId: z.string().min(1),
  steps: z
    .array(
      z.object({
        id: z.string().min(1),
        imagePrompt: z.string().min(1),
      }),
    )
    .max(12),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "invalid request" }, { status: 400 });
  }

  try {
    const generated = await Promise.all(
      parsed.data.steps.map(async ({ id, imagePrompt }) => {
        const imageUrl = await getOrCreate(cacheKey(imagePrompt), () =>
          generateTechniqueImage(imagePrompt),
        );
        return imageUrl === undefined ? undefined : ([id, imageUrl] as const);
      }),
    );

    return Response.json(Object.fromEntries(generated.filter((entry) => entry !== undefined)));
  } catch (error) {
    console.error("Image request failed", error);
    return Response.json({ error: "image generation failed" }, { status: 500 });
  }
}
