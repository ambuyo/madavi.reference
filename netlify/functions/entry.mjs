// Netlify Function — Astro SSR entry point
// This wraps the @astrojs/node standalone server for Netlify Functions
import { createServer } from "node:http";
import { URL } from "node:url";

// Dynamic import of the Astro server — built by @astrojs/node standalone mode
const { default: handler } = await import("../../apps/web/dist/server/entry.mjs");

export default async (request: Request, context: any) => {
  // Convert Web Request to Node.js IncomingMessage
  const url = new URL(request.url);

  // Create a simple Node.js request/response wrapper
  const nodeReq = {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers.entries()),
  };

  let body = "";
  let statusCode = 200;
  let responseHeaders: Record<string, string> = {};

  // Use the Astro handler directly — it's a standard node HTTP handler
  await new Promise<void>((resolve) => {
    const nodeRes = {
      writeHead: (status: number, headers: any) => {
        statusCode = status;
        responseHeaders = headers || {};
      },
      end: (data: string) => {
        body = data || "";
        resolve();
      },
      setHeader: (name: string, value: string) => {
        responseHeaders[name] = value;
      },
    };
    handler(nodeReq as any, nodeRes as any);
  });

  return new Response(body, {
    status: statusCode,
    headers: responseHeaders,
  });
};
