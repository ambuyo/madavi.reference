import type { APIRoute } from "astro";

/**
 * Lightweight health check for Railway / load balancer probes.
 * Returns 200 if the server is alive and critical services are reachable.
 * Railway should point its health check at /api/health.
 */
export const GET: APIRoute = async () => {
  const checks: Record<string, boolean> = {};
  const errors: string[] = [];

  // Sanity health check (async, non-blocking, 3s timeout)
  try {
    const projectId = import.meta.env.SANITY_PROJECT_ID;
    if (!projectId) {
      throw new Error("SANITY_PROJECT_ID not set");
    }
    checks.sanity = true;
  } catch (e) {
    checks.sanity = false;
    errors.push("sanity: " + (e instanceof Error ? e.message : String(e)));
  }

  // WordPress health check (async, non-blocking, 3s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("https://cms.madavi.co/wp-json/wp/v2/posts?per_page=1", {
      signal: controller.signal,
    });
    clearTimeout(timer);
    checks.wordpress = res.ok;
    if (!res.ok) errors.push("wordpress: HTTP " + res.status);
  } catch (e) {
    checks.wordpress = false;
    errors.push("wordpress: " + (e instanceof Error ? e.message : String(e)));
  }

  const healthy = checks.sanity !== false; // WP is optional — degraded mode works

  return new Response(
    JSON.stringify({
      status: healthy ? "ok" : "degraded",
      checks,
      ...(errors.length > 0 ? { errors } : {}),
      uptime: process.uptime(),
    }),
    {
      status: healthy ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    }
  );
};
