import { defineMiddleware } from "astro:middleware";

const PATH_REDIRECTS: Record<string, string> = {
  "/cdn-cgi/l/email-protection": "/legal/data-processing-agreement",
  "/legal/privacy": "/legal/privacy-policy",
};

export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  const host = context.request.headers.get("host") ?? "";
  const proto = context.request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");

  const hasWww = host.startsWith("www.");
  const isHttp = proto === "http";

  if (hasWww || isHttp) {
    url.protocol = "https:";
    url.host = hasWww ? host.slice(4) : host;
    return Response.redirect(url.toString(), 301);
  }

  const destination = PATH_REDIRECTS[url.pathname];
  if (destination) {
    return Response.redirect(new URL(destination, url.origin).toString(), 301);
  }

  return next();
});
