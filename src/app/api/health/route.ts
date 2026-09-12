export const dynamic = "force-dynamic";

const startedAt = Date.now();

export function GET() {
  return Response.json({
    status: "ok",
    uptimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    keys: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      google: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      fal: Boolean(process.env.FAL_KEY),
    },
  });
}
