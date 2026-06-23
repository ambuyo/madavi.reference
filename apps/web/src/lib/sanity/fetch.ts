import { getClient, previewClient } from "./client";

interface FetchOptions {
  preview?: boolean;
}

/**
 * Fetch data from Sanity with proper caching for Astro
 * Uses CDN for production, bypasses CDN for previews
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {}
): Promise<T> {
  const { preview = false } = options;
  const sanityClient = preview ? previewClient : getClient();

  return sanityClient.fetch<T>(query, params);
}
