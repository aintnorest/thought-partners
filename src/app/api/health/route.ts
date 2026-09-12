export const dynamic = "force-dynamic";

const startedAt = Date.now();

export function GET() {
  return Response.json({
    status: "ok",
    uptimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
