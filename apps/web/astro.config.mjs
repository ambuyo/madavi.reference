import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  redirects: {
    "/resources": { destination: "/blog", status: 301 },
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
      filter: (page) =>
        !page.includes("/api/") &&
        !page.includes("/llm-index"),

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
      }
    })
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
    // Optimize image formats and caching
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client"],
    },
  },
});
