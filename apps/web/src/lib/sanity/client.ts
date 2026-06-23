import { createClient } from "@sanity/client";
import type { SanityClient } from "@sanity/client";

function buildClient(overrides: Record<string, unknown> = {}): SanityClient | null {
  const projectId = import.meta.env.SANITY_PROJECT_ID || import.meta.env.PUBLIC_SANITY_PROJECT_ID;
  const dataset = import.meta.env.SANITY_DATASET || import.meta.env.PUBLIC_SANITY_DATASET || "production";

  if (!projectId) {
    console.warn("Sanity client: no projectId configured — client unavailable");
    return null as unknown as SanityClient;
  }

  return createClient({
    projectId,
    dataset,
    apiVersion: import.meta.env.SANITY_API_VERSION || "2024-01-01",
    useCdn: import.meta.env.PROD,
    token: import.meta.env.SANITY_READ_TOKEN,
    perspective: "published",
    timeout: 10_000,
    ...overrides,
  });
}

// Primary published client — null if projectId is not configured
export const client = buildClient();

// Client without CDN for real-time/preview — null if projectId is not configured
export const previewClient = buildClient({ useCdn: false, perspective: "previewDrafts" });

// Lazy getter that throws a clear error instead of silently returning null
export function getClient(): SanityClient {
  const c = client;
  if (!c) {
    throw new Error(
      "Sanity client is not configured. Set SANITY_PROJECT_ID and SANITY_DATASET environment variables."
    );
  }
  return c;
}
