import { defineMiddleware } from "astro:middleware";

// ── Global error boundary: prevent process crashes from unhandled errors ──
// Without this, any unhandled rejection or exception kills the Node process,
// causing 502 Bad Gateway errors on Railway until the process restarts.
//
// TRADEOFF: Node.js docs say not to resume after uncaughtException — the process
// may be in a corrupted state. We accept this risk because the alternative
// (crash on every exception) is guaranteed 502s during Railway's restart window.
// The counter threshold (5+ exceptions in 60s) is the safety valve: if errors
// pile up, we escalate to a clean Railway restart rather than limping along.

let errorCount = 0;
const ERROR_RESET_MS = 60_000; // reset counter after 1 min of quiet
const MAX_UNHANDLED_REJECTIONS = 10; // unhandled rejections are less severe than exceptions
const MAX_UNCAUGHT_EXCEPTIONS = 5;  // exceptions signal corrupted state — lower threshold
let errorResetTimer: ReturnType<typeof setTimeout> | null = null;

function resetErrorCount() {
  errorCount = 0;
  errorResetTimer = null;
}

process.on("unhandledRejection", (reason: unknown, _promise: Promise<unknown>) => {
  errorCount++;
  console.error("[FATAL] unhandledRejection — would have crashed the server", {
    count: errorCount,
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack?.split("\n").slice(0, 4).join("\n") } : String(reason),
  });

  // Reset counter after quiet period
  if (errorResetTimer) clearTimeout(errorResetTimer);
  errorResetTimer = setTimeout(resetErrorCount, ERROR_RESET_MS);

  // Crash if too many errors pile up (likely a systemic issue, not a transient)
  if (errorCount > MAX_UNHANDLED_REJECTIONS) {
    console.error(`[FATAL] ${MAX_UNHANDLED_REJECTIONS}+ unhandled rejections in 60s — escalating to crash for Railway restart`);
    process.exit(1);
  }
});

process.on("uncaughtException", (error: Error) => {
  errorCount++;
  console.error("[FATAL] uncaughtException — would have crashed the server", {
    count: errorCount,
    message: error.message,
    stack: error.stack?.split("\n").slice(0, 6).join("\n"),
  });

  if (errorResetTimer) clearTimeout(errorResetTimer);
  errorResetTimer = setTimeout(resetErrorCount, ERROR_RESET_MS);

  if (errorCount > MAX_UNCAUGHT_EXCEPTIONS) {
    console.error(`[FATAL] ${MAX_UNCAUGHT_EXCEPTIONS}+ uncaught exceptions in 60s — escalating to crash for Railway restart`);
    process.exit(1);
  }
});

const LLM_BOTS: Record<string, string> = {
  "GPTBot":         "OpenAI",
  "Claude-Web":     "Anthropic",
  "PerplexityBot":  "Perplexity AI",
  "YouBot":         "You.com",
  "Google-Extended":"Google AI",
  "CCBot":          "Common Crawl",
  "Applebot-Extended": "Apple",
  "Bytespider":     "ByteDance",
  "FacebookBot":    "Meta",
};

// Static path redirects — migrated from Netlify _redirects
const PATH_REDIRECTS: Record<string, string> = {
  "/cdn-cgi/l/email-protection": "/legal/data-processing-agreement",
  "/legal/privacy": "/legal/privacy-policy",
  "/category/accelerators-marketing": "/blog/cat/accelerators",
  // ── Netlify _redirects migrated ──
  "/contact":           "/get-a-proposal",
  "/contact-us":        "/get-a-proposal",
  "/reports":           "/resources/reports",
  "/the-agency":        "/the-imc-agency",
  "/free-brand-discovery": "/get-a-proposal",
  "/gro/profile/madavi": "/blog/cat/madavigro",
};

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  const host = context.request.headers.get("host") ?? "";
  const proto =
    context.request.headers.get("x-forwarded-proto") ??
    (() => {
      try {
        const cf = context.request.headers.get("CF-Visitor");
        if (cf) return JSON.parse(cf).scheme ?? "https";
      } catch {}
      return url.protocol.replace(":", "");
    })();

  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.") ||
                      url.hostname === "localhost" || url.hostname.startsWith("127.");
  const hasWww = host.startsWith("www.");
  const isHttp = proto === "http";

  // LLM bot visit logging
  const ua = context.request.headers.get("user-agent") ?? "";
  const botEntry = Object.entries(LLM_BOTS).find(([bot]) => ua.includes(bot));
  if (botEntry) {
    const [botName, company] = botEntry;
    console.log(JSON.stringify({
      type: "llm_visit",
      bot: botName,
      company,
      path: url.pathname,
      ts: new Date().toISOString(),
    }));
  }

  // SSL + www → naked redirect
  if (!import.meta.env.DEV && !isLocalhost && (hasWww || isHttp)) {
    url.protocol = "https:";
    url.host = hasWww ? host.slice(4) : host;
    return new Response(null, {
      status: 301,
      headers: {
        Location: url.toString(),
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      },
    });
  }

  // /category/{slug}[/] → /blog/cat/{slug}
  const categoryMatch = url.pathname.match(/^\/category\/([^/]+)\/?$/);
  if (categoryMatch) {
    return Response.redirect(new URL(`/blog/cat/${categoryMatch[1]}`, url.origin).toString(), 301);
  }

  // /writer/:username[/] → /blog/author/:username  (Netlify wildcard)
  const writerMatch = url.pathname.match(/^\/writer\/([^/]+)\/?$/);
  if (writerMatch) {
    return Response.redirect(new URL(`/blog/author/${writerMatch[1]}`, url.origin).toString(), 301);
  }

  // /work/:slug[/] → /our-work/:slug  (Netlify wildcard)
  const workMatch = url.pathname.match(/^\/work\/([^/]+)\/?$/);
  if (workMatch) {
    return Response.redirect(new URL(`/our-work/${workMatch[1]}`, url.origin).toString(), 301);
  }

  // Static path redirects
  const destination = PATH_REDIRECTS[url.pathname.replace(/\/$/, "")];
  if (destination) {
    return Response.redirect(new URL(destination, url.origin).toString(), 301);
  }

  // Apply security headers to all responses — with per-request error boundary
  try {
    return applySecurityHeaders(next());
  } catch (error) {
    console.error("[MIDDLEWARE] Request handler threw synchronously:", error instanceof Error ? error.message : String(error));
    return new Response("Internal Server Error", { status: 500 });
  }
});

async function applySecurityHeaders(response: Response | Promise<Response>): Promise<Response> {
  try {
    const res = await response;
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    res.headers.set("X-Frame-Options", "SAMEORIGIN");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return res;
  } catch (error) {
    console.error("[MIDDLEWARE] Request handler rejected:", error instanceof Error ? error.message : String(error));
    return new Response("Internal Server Error", { status: 500 });
  }
}

