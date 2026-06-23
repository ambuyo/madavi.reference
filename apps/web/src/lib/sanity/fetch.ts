import { getClient, previewClient } from "./client";

interface FetchOptions {
  preview?: boolean;
}

/**
 * Fetch data from Sanity with proper caching for Astro
 * Uses CDN for production, bypasses CDN for previews
 * Returns empty array if Sanity is not configured, so the build never crashes
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {}
): Promise<T> {
  const { preview = false } = options;

  try {
    const sanityClient = preview ? previewClient : getClient();
    return sanityClient.fetch<T>(query, params);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`Sanity fetch failed (${msg}) — returning empty result`);
    return [] as unknown as T;
  }
}
