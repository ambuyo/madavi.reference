import { defineMiddleware } from "astro:middleware";

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

const PATH_REDIRECTS: Record<string, string> = {
  "/cdn-cgi/l/email-protection": "/legal/data-processing-agreement",
  "/legal/privacy": "/legal/privacy-policy",
  // Legacy category slug renames (slug changed, not just path)
  "/category/accelerators-marketing": "/blog/cat/accelerators",
};

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  const host = context.request.headers.get("host") ?? "";
  const proto = context.request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.") ||
                      url.hostname === "localhost" || url.hostname.startsWith("127.");
  const hasWww = host.startsWith("www.");
  const isHttp = proto === "http";

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

  if (isLocalhost) {
    if (url.protocol === "https:") {
      url.protocol = "http:";
      return Response.redirect(url.toString(), 302);
    }
  } else if (hasWww || isHttp) {
    url.protocol = "https:";
    url.host = hasWww ? host.slice(4) : host;
    return Response.redirect(url.toString(), 301);
  }

  // /category/{slug}[/] → /blog/cat/{slug}
  const categoryMatch = url.pathname.match(/^\/category\/([^/]+)\/?$/);
  if (categoryMatch) {
    return Response.redirect(new URL(`/blog/cat/${categoryMatch[1]}`, url.origin).toString(), 301);
  }

  const destination = PATH_REDIRECTS[url.pathname.replace(/\/$/, "")];
  if (destination) {
    return Response.redirect(new URL(destination, url.origin).toString(), 301);
  }

  return next();
});
