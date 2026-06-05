import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET || "production",
  apiVersion: import.meta.env.SANITY_API_VERSION || "2024-01-01",
  useCdn: import.meta.env.PROD,
  token: import.meta.env.SANITY_READ_TOKEN,
  timeout: 10_000,
});

// Client without CDN for real-time/preview
export const previewClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET || "production",
  apiVersion: import.meta.env.SANITY_API_VERSION || "2024-01-01",
  useCdn: false,
  token: import.meta.env.SANITY_READ_TOKEN,
  timeout: 10_000,
});
