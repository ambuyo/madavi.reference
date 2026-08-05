import type { APIRoute } from "astro";

/**
 * Diagnostic endpoint — checks if prerendered HTML files exist on disk.
 * Hit this from your browser to see what the production server can find.
 *
 * GET https://madavi.co/api/diagnostic.json
 */
export const GET: APIRoute = async () => {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    node: typeof process !== "undefined" ? process.version : "unknown",
    cwd: typeof process !== "undefined" ? process.cwd() : "unknown",
    checks: {},
  };

  const pagesToCheck = [
    "/",
    "/our-approach",
    "/about",
    "/capabilities",
    "/services",
    "/blog",
    "/contact",
    "/404",
  ];

  try {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");

    // Try to find the client directory relative to the server entry
    const clientCandidates = [
      join(process.cwd(), "dist", "client"),
      join(process.cwd(), "client"),
    ];

    // Also try relative to the server entry point
    try {
      const { fileURLToPath } = await import("node:url");
      const entryDir = fileURLToPath(import.meta.url);
      clientCandidates.push(join(entryDir, "..", "..", "..", "client"));
    } catch {
      // client dir resolution is best-effort
    }

    let clientDir = "";
    for (const candidate of clientCandidates) {
      if (existsSync(candidate)) {
        clientDir = candidate;
        break;
      }
    }

    results.clientDir = clientDir || "NOT FOUND";
    results.clientCandidates = clientCandidates;

    if (clientDir) {
      results.clientDir = clientDir;
      for (const page of pagesToCheck) {
        // Check both /page/index.html and /page.html patterns
        const paths = page === "/"
          ? [join(clientDir, "index.html")]
          : [
              join(clientDir, page.slice(1), "index.html"),
              join(clientDir, page.slice(1) + ".html"),
            ];

        const found = paths.filter((p) => existsSync(p));
        results.checks[page] = {
          found: found.length > 0,
          paths: paths.map((p) => ({
            path: p,
            exists: existsSync(p),
          })),
        };
      }
    }
  } catch (err) {
    results.error = String(err);
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store",
    },
  });
};
