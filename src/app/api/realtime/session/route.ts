import { z } from "zod";
import { MODELS } from "@/lib/models";

const CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets";

const clientSecretResponseSchema = z.object({
  value: z.string(),
  expires_at: z.number(),
});

// Mints a short-lived OpenAI Realtime API client secret for the browser's voice session
// (narration + spoken Q&A). OPENAI_API_KEY never leaves this server; only the ephemeral
// secret, which expires in minutes, is returned to the client.
export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY not set" }, { status: 503 });
  }

  try {
    const response = await fetch(CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: MODELS.realtime,
          audio: { output: { voice: "marin" } },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("Realtime client secret request failed", response.status);
      return Response.json({ error: "voice session unavailable" }, { status: 502 });
    }

    const parsed = clientSecretResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("Realtime client secret response missing expected fields");
      return Response.json({ error: "voice session unavailable" }, { status: 502 });
    }

    return Response.json({ value: parsed.data.value, expiresAt: parsed.data.expires_at });
  } catch (error) {
    console.error("Failed to mint realtime client secret", error);
    return Response.json({ error: "voice session unavailable" }, { status: 502 });
  }
}
