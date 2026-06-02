import type { WordPressPost } from "./fetch";
import * as fs from "fs";
import * as path from "path";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Build time: CWD = apps/web → .cache/wordpress-posts.json
// Runtime:    CWD = repo root → apps/web/.cache/wordpress-posts.json
const POSTS_CACHE_FILE = [
  path.join(".cache", "wordpress-posts.json"),
  path.join("apps", "web", ".cache", "wordpress-posts.json"),
].find(fs.existsSync) ?? path.join(".cache", "wordpress-posts.json");

const CACHE_DIR = path.dirname(POSTS_CACHE_FILE);

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
    await writeCachedPosts(posts);
    console.log(`[cache] Refreshed — ${posts.length} posts from cms.madavi.co`);
  } catch (error) {
    console.error("[cache] Failed to refresh posts from cms.madavi.co:", error);
    if (cache) cache.refreshing = false;
  }
}

export async function readCachedPosts(): Promise<WordPressPost[] | null> {
  // Seed from disk on first boot (fast, no API call)
  if (!cache) {
    try {
      if (fs.existsSync(POSTS_CACHE_FILE)) {
        const data = fs.readFileSync(POSTS_CACHE_FILE, "utf-8");
        const posts: WordPressPost[] = JSON.parse(data);
        // timestamp=0 so first request triggers a background refresh
        cache = { posts, timestamp: 0, refreshing: false };
      }
    } catch {
      // ignore — will fall through to background refresh
    }
  }

  // If stale, refresh in background (stale-while-revalidate)
  // Caller gets current data immediately; next request gets fresh data
  if (isStale()) {
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

export async function writeCachedPosts(posts: WordPressPost[]): Promise<void> {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(POSTS_CACHE_FILE, JSON.stringify(posts, null, 2));
  } catch (error) {
    console.error("[cache] Failed to write posts to disk:", error);
  }
}
