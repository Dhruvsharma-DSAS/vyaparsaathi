import { NextResponse, type NextRequest } from "next/server";
import { isAllowedPath } from "@/lib/proxy-path";

/**
 * Same-origin proxy to the Python API (Render).
 *
 * The browser calls /api/backend/<path> on this site and the server forwards it, so:
 * - every Vercel URL (production, preview, deployment links) works without CORS changes;
 * - the API address is read at request time, so changing it on Vercel needs no rebuild.
 *
 * Set API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL) to the Render URL, e.g. https://vyaparsaathi-api.onrender.com.
 */
export const runtime = "nodejs";
// A sleeping free Render instance can take ~60 s to wake up.
export const maxDuration = 120;

const UPSTREAM_TIMEOUT_MS = 100_000;

function upstreamBase() {
  const base = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  return base.replace(/\/+$/, "");
}

async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (!isAllowedPath(path)) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  const target = `${upstreamBase()}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        accept: request.headers.get("accept") ?? "application/json",
        ...(hasBody ? { "content-type": request.headers.get("content-type") ?? "application/json" } : {}),
      },
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    return new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { detail: timedOut ? "The API took too long to respond." : "The API could not be reached." },
      { status: timedOut ? 504 : 502 },
    );
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
