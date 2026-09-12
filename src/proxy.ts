import { type NextRequest, NextResponse } from "next/server";

/**
 * Rejects API calls that do not come from this app's own pages.
 *
 * Browsers send `Origin` on every cross-origin request and on same-origin POSTs;
 * `Sec-Fetch-Site` is sent by all modern browsers and cannot be set by scripts.
 * We accept a request when either says it is same-origin, or when `Origin` matches
 * this deployment's own host (covers localhost, preview URLs, and the production
 * domain without a config list). Requests with neither header (curl, scanners)
 * are refused. GET /api/health stays open so uptime checks and the key probe work.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/api/health") return NextResponse.next();

  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin") return NextResponse.next();

  const origin = request.headers.get("origin");
  if (origin) {
    const selfHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost: string | undefined;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = undefined;
    }
    if (originHost !== undefined && originHost === selfHost) return NextResponse.next();
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export const config = {
  matcher: "/api/:path*",
};
