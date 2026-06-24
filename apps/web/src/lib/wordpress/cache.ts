import type { WordPressPost } from "./fetch";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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

export async function readCachedPosts(): Promise<WordPressPost[] | null> {
  // First call: fetch eagerly from the WordPress API
  if (!cache) {
    await refreshFromWP();
  } else if (isStale()) {
    // Subsequent stale reads: refresh in background (stale-while-revalidate)
    refreshFromWP();
  }

  return cache?.posts ?? null;
}

export function getMemoryPosts(): WordPressPost[] | null {
  return cache?.posts ?? null;
}

export function setMemoryPosts(posts: WordPressPost[]): void {
  cache = { posts, timestamp: Date.now(), refreshing: false };
}
