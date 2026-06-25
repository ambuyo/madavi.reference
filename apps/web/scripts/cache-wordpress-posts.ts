// Build-time script to fetch and cache WordPress posts
// Run this before deploying to ensure posts are up-to-date
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { wpFetch, CACHE_LIMIT, PAGE_SIZE } from "../src/lib/wordpress/client";
import type { WordPressPost } from "../src/lib/wordpress/fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Write to public/.cache/ so the file is deployed as a static asset
const PUBLIC_CACHE_DIR = path.join(__dirname, "..", "public", ".cache");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Only fetch fields we actually use — strips unused WP meta, reducing cache size significantly
const FIELDS = [
  "id",
  "slug",
  "date",
  "title",
  "excerpt",
  "content",
  "_links",     // required for _embed to populate _embedded
  "_embedded",
].join(",");

// Only embed the three data types we use — skips tags, curies, post-type links etc.
const EMBED = "wp:featuredmedia,author,wp:term";

function slimPost(post: WordPressPost): WordPressPost {
  const { _links, ...rest } = post as any;

  // Keep full content — individual post pages serve from cache
  // No content truncation: the cache is the source of truth for all blog views

  // Strip excerpt HTML down to rendered text only (listings only need short excerpts)
  if (rest.excerpt?.rendered) {
    rest.excerpt = { rendered: rest.excerpt.rendered.slice(0, 500) };
  }

  if (rest._embedded) {
    // Author: keep only name, slug, avatar_urls, description
    if (rest._embedded.author) {
      rest._embedded.author = rest._embedded.author.map((a: any) => ({
        name: a.name,
        slug: a.slug,
        description: a.description || "",
        avatar_urls: a.avatar_urls
          ? { "96": a.avatar_urls["96"] }
          : undefined,
      }));
    }

    // Featured media: keep only source_url
    if (rest._embedded["wp:featuredmedia"]) {
      rest._embedded["wp:featuredmedia"] = rest._embedded["wp:featuredmedia"].map((m: any) => ({
        source_url: m.source_url,
      }));
    }

    // Terms: keep only id, name, slug, taxonomy
    if (rest._embedded["wp:term"]) {
      rest._embedded["wp:term"] = rest._embedded["wp:term"].map((termGroup: any[]) =>
        termGroup.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug, taxonomy: t.taxonomy }))
      );
    }
  }

  return rest as WordPressPost;
}

async function cachePosts() {
  const startTime = Date.now();
  try {
    console.log(`📝 Fetching up to ${CACHE_LIMIT} WordPress posts...`);

    // Determine how many pages we need
    const pagesNeeded = Math.ceil(CACHE_LIMIT / PAGE_SIZE);

    // Parallelize: fetch all pages concurrently
    const pageBatches = await Promise.all(
      Array.from({ length: pagesNeeded }, (_, i) =>
        wpFetch<WordPressPost[]>(
          `/posts?_embed=${EMBED}&_fields=${FIELDS}&per_page=${PAGE_SIZE}&page=${i + 1}&orderby=date&order=desc`
        )
      )
    );

    const allPosts: WordPressPost[] = [];
    for (let i = 0; i < pageBatches.length; i++) {
      const batch = pageBatches[i];
      allPosts.push(...batch);
      console.log(`  Page ${i + 1}: ${batch.length} posts (total: ${allPosts.length})`);
      if (batch.length < PAGE_SIZE) break;
    }

    const slimmedPosts = allPosts.slice(0, CACHE_LIMIT).map(slimPost);

    // Enrich author descriptions — _embed doesn't return description, fetch users directly
    const authorSlugs = [...new Set(
      slimmedPosts
        .map((p: any) => p._embedded?.author?.[0]?.slug)
        .filter(Boolean)
    )];

    if (authorSlugs.length > 0) {
      const users = await wpFetch<any[]>(`/users?slug=${authorSlugs.join(",")}&per_page=100`);
      const bioBySlug: Record<string, string> = {};
      for (const u of users) {
        if (u.slug && u.description) bioBySlug[u.slug] = u.description;
      }
      for (const post of slimmedPosts as any[]) {
        const author = post._embedded?.author?.[0];
        if (author?.slug && bioBySlug[author.slug]) {
          author.description = bioBySlug[author.slug];
        }
      }
      console.log(`👤 Enriched bios for ${Object.keys(bioBySlug).length} author(s)`);
    }

    // Write cache to public/.cache/ — deployed as static asset
    ensureDir(PUBLIC_CACHE_DIR);
    fs.writeFileSync(path.join(PUBLIC_CACHE_DIR, "wordpress-posts.json"), JSON.stringify(slimmedPosts));

    const duration = Date.now() - startTime;
    console.log(`✅ Cached ${slimmedPosts.length} WordPress posts in ${duration}ms`);
    console.log(`📊 Cache deployed — instant page loads until next redeploy`);
  } catch (error) {
    console.error("⚠️  Failed to cache WordPress posts (build will continue):", error);
    // Don't exit 1 — build proceeds without cached posts; they'll be fetched live at runtime
  }
}

cachePosts();
