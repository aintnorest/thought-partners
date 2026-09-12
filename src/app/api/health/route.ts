export const dynamic = "force-dynamic";

const startedAt = Date.now();

interface KeyProbe {
  valid: boolean;
  usage?: number;
  limit?: number | null;
  limitRemaining?: number | null;
  error?: string;
}

/** Free call: validates the server key against OpenRouter without spending credits. Never returns the key. */
async function probeOpenRouterKey(key: string | undefined): Promise<KeyProbe> {
  if (!key) return { valid: false, error: "OPENROUTER_API_KEY not set" };
  try {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return { valid: false, error: `openrouter ${response.status}` };
    const { data } = (await response.json()) as {
      data: { usage: number; limit: number | null; limit_remaining: number | null };
    };
    return {
      valid: true,
      usage: data.usage,
      limit: data.limit,
      limitRemaining: data.limit_remaining,
    };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "probe failed" };
  }
}

export async function GET(request: Request) {
  const probe = new URL(request.url).searchParams.get("probe") === "1";
  return Response.json({
    status: "ok",
    uptimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    keys: {
      openrouter: Boolean(process.env.OPENROUTER_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
    },
    ...(probe ? { openrouter: await probeOpenRouterKey(process.env.OPENROUTER_API_KEY) } : {}),
  });
}
