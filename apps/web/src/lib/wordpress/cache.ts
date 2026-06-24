import type { WordPressPost } from "./fetch";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FILE_CACHE_PATH = "/.cache/wordpress-posts.json";

interface CacheState {
  posts: WordPressPost[];
  timestamp: number;
  refreshing: boolean;
}

let cache: CacheState | null = null;

function isStale(): boolean {
  if (!cache) return true;
  return Date.now() - cache.timestamp > CACHE_TTL_MS;
}

/**
 * Load posts from the deployed JSON cache file.
 * This file is written at build time by scripts/cache-wordpress-posts.ts
 * and deployed as a static asset — instant cold starts, no WP API call needed.
 */
async function loadFromFileCache(): Promise<boolean> {
  try {
    const response = await fetch(FILE_CACHE_PATH);
    if (!response.ok) return false;

    const posts: WordPressPost[] = await response.json();
    if (posts && posts.length > 0) {
      cache = { posts, timestamp: Date.now(), refreshing: false };
      console.log(`[cache] Loaded ${posts.length} posts from deployed cache`);
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[cache] Failed to load deployed cache:", error);
    return false;
  }
}

/**
 * Refresh posts from the live WordPress API.
 * Used as fallback when file cache is unavailable, and for
 * background stale-while-revalidate refreshes between deploys.
 */
async function refreshFromWP(): Promise<void> {
  if (cache?.refreshing) return;
  if (cache) cache.refreshing = true;

  try {
    const { fetchWordPressPosts } = await import("./fetch");
    const posts = await fetchWordPressPosts();
    cache = { posts, timestamp: Date.now(), refreshing: false };
    console.log(`[cache] Refreshed — ${posts.length} posts from cms.madavi.co`);
  } catch (error) {
    console.error("[cache] Failed to refresh posts from cms.madavi.co:", error);
    if (cache) cache.refreshing = false;
  }
}

/**
 * Read cached posts with layered fallback:
 * 1. In-memory cache (instant — warm requests)
 * 2. Deployed JSON file (instant — cold starts, no WP API call)
 * 3. Live WordPress API (fallback — if file cache missing)
 *
 * Stale caches trigger a background refresh from WP without blocking.
 */
export async function readCachedPosts(): Promise<WordPressPost[] | null> {
  // First call: try deployed file cache, then fall back to live WP
  if (!cache) {
    const loaded = await loadFromFileCache();
    if (!loaded) {
      await refreshFromWP();
    }
  } else if (isStale()) {
    // Stale: refresh in background (stale-while-revalidate)
    // Don't await — serve stale content while refresh happens
    refreshFromWP().catch(() => {});
  }

  return cache?.posts ?? null;
}

/**
 * Get posts from memory without triggering any fetch.
 * Used by revalidate webhook to check current state.
 */
export function getMemoryPosts(): WordPressPost[] | null {
  return cache?.posts ?? null;
}

/**
 * Set memory cache directly — used by the revalidate webhook
 * to update the cache after a live WP fetch.
 */
export function setMemoryPosts(posts: WordPressPost[]): void {
  cache = { posts, timestamp: Date.now(), refreshing: false };
}
