/* global process */
import node from "@astrojs/node";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

const target = process.env.DEPLOY_TARGET || "vps";
const isCloudflare = target === "cloudflare";

export default defineConfig({
  output: "server",
  // adapter: isCloudflare ? cloudflare() : node({ mode: "standalone" }),
  adapter: node({ mode: "standalone" }),
  redirects: {
    "/resources": { destination: "/blog", status: 301 },
    "/work/[...slug]": { destination: "/our-work/[...slug]", status: 301 },
    "/capabilities/brand-communications": {
      destination: "/capabilities/brand-communication",
      status: 301,
    },
    "/gro/courses/artificial-intelligence-in-digital-marketing/": {
      destination: "/our-work/",
      status: 301,
    },
    "/turn-your-business-to-an-authentic-brand-in-kenya/": {
      destination: "/blog",
      status: 301,
    },
    "/ai-studio/agents-development/kuzafy/": {
      destination: "/solutions/kuzafy/",
      status: 301,
    },
  },
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "css-variables",
    },
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  site: "https://madavi.co",
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/api/") && !page.includes("/llm-index"),

      serialize: (item) => {
        // Add change frequency hints for LLM crawlers
        if (item.url.includes("/blog/") || item.url.includes("the-")) {
          item.changefreq = "weekly";
          item.priority = 0.9;
        } else if (item.url === "https://madavi.co/") {
          item.priority = 1.0;
          item.changefreq = "daily";
        } else if (item.url.includes("/blog")) {
          item.priority = 0.8;
          item.changefreq = "weekly";
        } else {
          item.changefreq = "monthly";
          item.priority = 0.7;
        }
        return item;
      },
    }),
  ],
  image: {
    // Authorize WordPress and R2 domains for remote image optimization
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cms.madavi.co",
      },
      {
        protocol: "https",
        hostname: "images.madavi.co",
      },
      {
        protocol: "https",
        hostname: "cdn.madavi.co",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
    // Cloudflare Pages doesn't support sharp (native binary).
    // Use the no-op passthrough on Cloudflare; sharp on VPS.
    service: isCloudflare
      ? { entrypoint: "astro/assets/services/noop" }
      : { entrypoint: "astro/assets/services/sharp" },
  },
  vite: {
    plugins: [],
    resolve: {
      alias: {
        "@": "/src",
      },
      // Workers have DOMParser (Web API) but not require().
      // Force browser builds for packages that have Node/browser forks.
      conditions: isCloudflare
        ? ["browser", "worker", "development|production"]
        : [],
    },
    ssr: {
      // turndown MUST stay external on Cloudflare. It internally calls
      // require('@mixmark-io/domino') which crashes Workers at runtime.
      // markdown.ts loads it via try { await import("turndown") } catch {} —
      // on Workers the import fails gracefully, htmlToMarkdown returns "".
      external: isCloudflare ? ["turndown"] : [],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client"],
    },
  },
});
