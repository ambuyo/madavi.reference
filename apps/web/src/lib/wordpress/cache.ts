import type { WordPressPost } from "./fetch";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FILE_CACHE_PATH = "/.cache/wordpress-posts.json";

// Workers require absolute URLs for fetch(). Try the Astro site URL first,
// then fall back to the production URL.
const SITE_URL = (typeof import.meta !== "undefined" && (import.meta as any).env?.SITE) || "https://madavi.co";

// Filesystem path for Node.js runtime (Docker/VPS).
// public/.cache/ is copied to dist/client/.cache/ at build time.
// The server entry runs from dist/server/, so the client dir is ../client.
function getFileCacheDiskPath(): string {
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // In production: dist/server/chunks/ → ../../client/.cache/wordpress-posts.json
    // In dev: src/lib/wordpress/ → ../../../../public/.cache/wordpress-posts.json
    const candidates = [
      path.join(__dirname, "..", "client", ".cache", "wordpress-posts.json"),
      path.join(__dirname, "..", "..", "client", ".cache", "wordpress-posts.json"),
      path.join(__dirname, "..", "..", "..", "..", "public", ".cache", "wordpress-posts.json"),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
  } catch {
    // fileURLToPath may not be available (e.g. Cloudflare Workers)
  }
  return "";
}

// ── Index types ──────────────────────────────────────────────────────────

interface CacheIndices {
  bySlug: Map<string, WordPressPost>;
  byCategory: Map<string, WordPressPost[]>;
  byAuthor: Map<string, WordPressPost[]>;
  byTag: Map<string, WordPressPost[]>;
}

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
}

interface SubcategoryInfo {
  id: number;
  name: string;
  slug: string;
  parentId: number;
}

// ── Cache state ───────────────────────────────────────────────────────────

interface CacheState {
  posts: WordPressPost[];
  transformed: any[] | null;          // Post[] — lazily populated
  indices: CacheIndices | null;
  allCategories: CategoryInfo[];
  allSubcategories: SubcategoryInfo[];
  allTags: string[];
  timestamp: number;
  refreshing: boolean;
}

let cache: CacheState | null = null;

function isStale(): boolean {
  if (!cache) return true;
  return Date.now() - cache.timestamp > CACHE_TTL_MS;
}

// ── Index builder ────────────────────────────────────────────────────────

function buildIndices(posts: WordPressPost[]): {
  indices: CacheIndices;
  allCategories: CategoryInfo[];
  allSubcategories: SubcategoryInfo[];
  allTags: string[];
} {
  const bySlug = new Map<string, WordPressPost>();
  const byCategory = new Map<string, WordPressPost[]>();
  const byAuthor = new Map<string, WordPressPost[]>();
  const byTag = new Map<string, WordPressPost[]>();
  const categorySet = new Map<string, CategoryInfo>();
  const subcategorySet = new Map<string, SubcategoryInfo>();
  const tagSet = new Set<string>();

  for (const post of posts) {
    // Slug index
    bySlug.set(post.slug, post);

    // Term indices
    const terms = post._embedded?.["wp:term"];
    if (terms) {
      for (const termArray of terms) {
        for (const term of termArray) {
          if (term.taxonomy === "category") {
            // Category index
            const catSlug = term.slug;
            if (!byCategory.has(catSlug)) byCategory.set(catSlug, []);
            byCategory.get(catSlug)!.push(post);

            if (term.parent > 0) {
              // Subcategory
              if (!subcategorySet.has(term.slug)) {
                subcategorySet.set(term.slug, {
                  id: term.id,
                  name: term.name,
                  slug: term.slug,
                  parentId: term.parent,
                });
              }
            } else {
              // Top-level category
              if (!categorySet.has(term.slug)) {
                categorySet.set(term.slug, {
                  id: term.id,
                  name: term.name,
                  slug: term.slug,
                });
              }
            }
          } else if (term.taxonomy === "post_tag") {
            // Tag index
            const tagSlug = term.slug;
            if (!byTag.has(tagSlug)) byTag.set(tagSlug, []);
            byTag.get(tagSlug)!.push(post);
            tagSet.add(tagSlug);
          }
        }
      }
    }

    // Author index
    const author = post._embedded?.author?.[0];
    if (author?.slug) {
      if (!byAuthor.has(author.slug)) byAuthor.set(author.slug, []);
      byAuthor.get(author.slug)!.push(post);
    }
  }

  return {
    indices: { bySlug, byCategory, byAuthor, byTag },
    allCategories: [...categorySet.values()].sort((a, b) => a.name.localeCompare(b.name)),
    allSubcategories: [...subcategorySet.values()].sort((a, b) => a.name.localeCompare(b.name)),
    allTags: [...tagSet].sort(),
  };
}

// ── File cache loader ────────────────────────────────────────────────────

/**
 * Load posts from the deployed JSON cache file.
 * This file is written at build time by scripts/cache-wordpress-posts.ts
 * and deployed as a static asset — instant cold starts, no WP API call needed.
 */
async function loadFromFileCache(): Promise<boolean> {
  // 1. Try filesystem first (Node.js/VPS runtime — instant, no network)
  const diskPath = getFileCacheDiskPath();
  if (diskPath) {
    try {
      const raw = fs.readFileSync(diskPath, "utf-8");
      const posts: WordPressPost[] = JSON.parse(raw);
      if (posts && posts.length > 0) {
        const { indices, allCategories, allSubcategories, allTags } = buildIndices(posts);
        cache = {
          posts,
          transformed: null,
          indices,
          allCategories,
          allSubcategories,
          allTags,
          timestamp: Date.now(),
          refreshing: false,
        };
        console.log(`[cache] Loaded ${posts.length} posts from disk cache`);
        return true;
      }
    } catch {
      // Disk read failed — try network fallback
    }
  }

  // 2. Network fallback (Cloudflare Workers runtime)
  const urls = [
    `${SITE_URL}${FILE_CACHE_PATH}`,  // Absolute URL
    FILE_CACHE_PATH,                    // Relative path
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const posts: WordPressPost[] = await response.json();
      if (posts && posts.length > 0) {
        const { indices, allCategories, allSubcategories, allTags } = buildIndices(posts);
        cache = {
          posts,
          transformed: null,
          indices,
          allCategories,
          allSubcategories,
          allTags,
          timestamp: Date.now(),
          refreshing: false,
        };
        console.log(`[cache] Loaded ${posts.length} posts from deployed cache`);
        return true;
      }
    } catch {
      // Try next URL format
    }
  }

  return false;
}

// ── Live WP refresh ──────────────────────────────────────────────────────

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
    const { indices, allCategories, allSubcategories, allTags } = buildIndices(posts);
    cache = {
      posts,
      transformed: null,  // lazy — transformed on first read
      indices,
      allCategories,
      allSubcategories,
      allTags,
      timestamp: Date.now(),
      refreshing: false,
    };
    console.log(`[cache] Refreshed — ${posts.length} posts from cms.madavi.co`);
  } catch (error) {
    console.error("[cache] Failed to refresh posts from cms.madavi.co:", error);
    if (cache) cache.refreshing = false;
  }
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Read cached posts with layered fallback:
 * 1. In-memory cache (instant — warm requests)
 * 2. Deployed JSON file (instant — cold starts, no WP API call)
 * 3. Live WordPress API (fallback — if file cache missing)
 *
 * Stale caches trigger a background refresh from WP without blocking.
 */
export async function readCachedPosts(): Promise<WordPressPost[] | null> {
  if (!cache) {
    const loaded = await loadFromFileCache();
    if (!loaded) {
      await refreshFromWP();
    }
  } else if (isStale()) {
    // Stale: refresh in background (stale-while-revalidate)
    refreshFromWP().catch(() => {});
  }

  return cache?.posts ?? null;
}

/**
 * Get pre-transformed Post[] from cache.
 * Loads cache if needed, then lazily runs transformWordPressPost on all posts.
 * Transform happens exactly once per cache load — subsequent calls return cached result.
 */
export async function readCachedTransformedPosts(): Promise<any[] | null> {
  const posts = await readCachedPosts();
  if (!posts || posts.length === 0) return null;
  if (!cache) return null;

  // Lazily transform — only if not already done
  if (!cache.transformed) {
    const { transformWordPressPost } = await import("./transforms");
    cache.transformed = posts.map(transformWordPressPost);
    console.log(`[cache] Transformed ${cache.transformed.length} posts (Turndown pass)`);
  }

  return cache.transformed;
}

// ── Index-based accessors ────────────────────────────────────────────────

/** Get a single post by slug from cache (O(1)). Returns null if not in cache. */
export async function getCachedPostBySlug(slug: string): Promise<WordPressPost | null> {
  await readCachedPosts(); // ensure cache is loaded
  return cache?.indices?.bySlug.get(slug) ?? null;
}

/** Get posts by category slug from cache index (O(1) lookup). */
export async function getCachedPostsByCategory(slug: string): Promise<WordPressPost[]> {
  await readCachedPosts();
  return cache?.indices?.byCategory.get(slug) ?? [];
}

/** Get posts by author slug from cache index (O(1) lookup). */
export async function getCachedPostsByAuthor(slug: string): Promise<WordPressPost[]> {
  await readCachedPosts();
  return cache?.indices?.byAuthor.get(slug) ?? [];
}

/** Get posts by tag slug from cache index (O(1) lookup). */
export async function getCachedPostsByTag(slug: string): Promise<WordPressPost[]> {
  await readCachedPosts();
  return cache?.indices?.byTag.get(slug) ?? [];
}

/** Get all unique categories from cache. */
export async function getCachedAllCategories(): Promise<CategoryInfo[]> {
  await readCachedPosts();
  return cache?.allCategories ?? [];
}

/** Get all unique subcategories from cache. */
export async function getCachedAllSubcategories(): Promise<SubcategoryInfo[]> {
  await readCachedPosts();
  return cache?.allSubcategories ?? [];
}

/** Get all unique tags from cache. */
export async function getCachedAllTags(): Promise<string[]> {
  await readCachedPosts();
  return cache?.allTags ?? [];
}

// ── Memory cache direct access (used by revalidate webhook) ──────────────

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
  const { indices, allCategories, allSubcategories, allTags } = buildIndices(posts);
  cache = {
    posts,
    transformed: null,  // reset — will re-transform on next read
    indices,
    allCategories,
    allSubcategories,
    allTags,
    timestamp: Date.now(),
    refreshing: false,
  };
}
