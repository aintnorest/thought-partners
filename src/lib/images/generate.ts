import { generateImage } from "ai";
import { MODELS } from "@/lib/models";
import { openrouter } from "@/lib/openrouter";

export const STYLE_PREAMBLE =
  "Clean instructional line sketch, white background, top-down view, no text, no labels, minimal shading. ";

export async function generateTechniqueImage(imagePrompt: string): Promise<string | undefined> {
  const prompt = STYLE_PREAMBLE + imagePrompt;

  try {
    const { image } = await generateImage({
      model: openrouter.imageModel(MODELS.image),
      prompt,
    });
    return `data:${image.mediaType ?? "image/png"};base64,${image.base64}`;
  } catch (primaryError) {
    try {
      const { image } = await generateImage({
        model: openrouter.imageModel(MODELS.imageFallback),
        prompt,
      });
      return `data:${image.mediaType ?? "image/png"};base64,${image.base64}`;
    } catch (fallbackError) {
      console.error("Image generation failed for both models", {
        primaryError,
        fallbackError,
      });
      return undefined;
    }
  }
}
