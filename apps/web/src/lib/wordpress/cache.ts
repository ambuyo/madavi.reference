import type { WordPressPost } from "./fetch";
import * as fs from "fs";
import * as path from "path";

const CACHE_DIR = ".cache";
const POSTS_CACHE_FILE = path.join(CACHE_DIR, "wordpress-posts.json");

// In-memory cache — persists for the lifetime of the Node.js server process.
// Seeded from the build-time file cache on first access, updated via webhook.
let memoryCache: WordPressPost[] | null = null;

export function getMemoryPosts(): WordPressPost[] | null {
  return memoryCache;
}

export function setMemoryPosts(posts: WordPressPost[]): void {
  memoryCache = posts;
}

export async function readCachedPosts(): Promise<WordPressPost[] | null> {
  // Return in-memory cache if already loaded (avoids repeated disk reads)
  if (memoryCache) return memoryCache;

  try {
    if (!fs.existsSync(POSTS_CACHE_FILE)) {
      return null;
    }
    const data = fs.readFileSync(POSTS_CACHE_FILE, "utf-8");
    const posts: WordPressPost[] = JSON.parse(data);
    memoryCache = posts;
    return posts;
  } catch {
    return null;
  }
}

export async function writeCachedPosts(posts: WordPressPost[]): Promise<void> {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(POSTS_CACHE_FILE, JSON.stringify(posts, null, 2));
  } catch (error) {
    console.error("Failed to write posts cache:", error);
  }
}
