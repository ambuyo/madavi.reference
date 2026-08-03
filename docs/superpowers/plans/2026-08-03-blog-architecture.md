# Blog Architecture — Optimized Prerender + SSR Fallback

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 1.9MB single-file cache with a two-tier system (80KB index + per-post files), pre-compute Turndown at build time, and make the blog index light-SSR with a live-WP fallback for new posts.

**Architecture:** Build script generates `index.json` (title/excerpt/image/date/category/author, ~80KB) and `posts/{slug}.json` (full markdown body, ~3KB each). Data layer reads these directly — no Turndown at runtime. Blog index is light SSR (80KB read + 1 WP API call), post detail is hybrid (prerender cached + SSR fallback for new slugs).

**Tech Stack:** Astro SSR, Netlify adapter, WordPress REST API, Turndown (build-time only), TypeScript

## Global Constraints

- WordPress publishes weekly, 2-min delay acceptable for cache population
- New articles must appear immediately at direct URL (SSR fallback)
- Blog index must include new articles without a redeploy
- Netlify function timeout: 10s default — all SSR paths must complete within
- No Turndown at runtime — only in build script

---

## File Structure

```
Modify:
  apps/web/scripts/cache-wordpress-posts.ts    — build script: two-tier output
  apps/web/src/lib/data.ts                     — thin read layer + live WP fetch
  apps/web/src/lib/wordpress/fetch.ts          — add getPostBySlugLive helper
  apps/web/src/pages/blog/[...slug].astro      — hybrid prerender + SSR fallback
  apps/web/src/pages/blog/index.astro          — light SSR with merged cache+live
  apps/web/src/pages/blog/cat/[...category].astro  — use new getPostsByCategory
  apps/web/src/pages/blog/tags/[tag].astro     — use new getPostsByTag
  apps/web/src/pages/blog/author/[...username].astro — use new getPostsByAuthor
  apps/web/src/lib/wordpress/transforms.ts     — simplify, remove from runtime path
  netlify.toml                                 — function timeout config
```

---

### Task 1: Rewrite cache build script — two-tier output + pre-computed Turndown

**Files:**
- Modify: `apps/web/scripts/cache-wordpress-posts.ts`

**Interfaces:**
- Consumes: `wpFetch` from `../src/lib/wordpress/client`, `writeCachedPosts` from `../src/lib/wordpress/cache`
- Produces: `.cache/index.json` (type `PostIndexEntry[]`), `.cache/posts/{slug}.json` (type `Post`), `writePostCache()`, `writeIndexCache()`

- [ ] **Step 1: Add Turndown import and cache directory setup**

At the top of the script, add:

```ts
import TurndownService from "turndown";
import * as path from "path";
import * as fs from "fs";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  linkStyle: "inlined",
});

const CACHE_DIR = path.join(__dirname, "..", ".cache");
const POSTS_DIR = path.join(CACHE_DIR, "posts");
```

- [ ] **Step 2: Add write helper functions**

Add below the imports, before `cachePosts()`:

```ts
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writePostCache(slug: string, post: Record<string, unknown>): void {
  ensureDir(POSTS_DIR);
  fs.writeFileSync(
    path.join(POSTS_DIR, `${slug}.json`),
    JSON.stringify(post, null, 2)
  );
}

function writeIndexCache(entries: Record<string, unknown>[]): void {
  ensureDir(CACHE_DIR);
  fs.writeFileSync(
    path.join(CACHE_DIR, "index.json"),
    JSON.stringify(entries, null, 2)
  );
}

function computeReadingTime(plainText: string): string {
  const words = plainText.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}
```

- [ ] **Step 3: Add post transformation function**

Add `transformPost()` — runs Turndown once per post at build time:

```ts
function transformPost(wpPost: WordPressPost) {
  // Decode HTML entities
  const htmlContent = decodeHtmlEntities(wpPost.content.rendered);

  // Run Turndown ONCE — never at runtime
  const markdown = turndownService.turndown(htmlContent);
  const plainText = stripHtml(htmlContent);
  const readingTime = computeReadingTime(plainText);

  // Extract categories and tags from embedded terms
  const categories: { name: string; slug: string }[] = [];
  const tags: string[] = [];
  if (wpPost._embedded?.["wp:term"]) {
    for (const termArray of wpPost._embedded["wp:term"]) {
      for (const term of termArray) {
        if (term.taxonomy === "category") {
          categories.push({ name: term.name, slug: term.slug });
        } else if (term.taxonomy === "post_tag") {
          tags.push(term.slug);
        }
      }
    }
  }

  // Extract author
  const wpAuthor = wpPost._embedded?.author?.[0];
  const author = wpAuthor ? {
    name: wpAuthor.name,
    slug: wpAuthor.slug,
    avatar: wpAuthor.avatar_urls?.["96"] || "",
    bio: wpAuthor.description || "",
  } : undefined;

  // Extract featured image
  const featuredMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0];
  const image = featuredMedia ? {
    url: featuredMedia.source_url,
    alt: wpPost.title.rendered.replace(/<\/?[^>]+(>|$)/g, ""),
  } : { url: "", alt: "" };

  const title = stripHtml(wpPost.title.rendered);
  const excerpt = stripHtml(wpPost.excerpt.rendered).slice(0, 300);

  return {
    // Full post — written to posts/{slug}.json
    full: {
      slug: wpPost.slug,
      title,
      date: wpPost.date,
      image,
      categories,
      author,
      body: htmlContent,
      markdown,
      plainText,
      readingTime,
      seo: {
        title: `${title} | Madavi`,
        description: excerpt,
      },
    },
    // Index entry — written to index.json
    index: {
      slug: wpPost.slug,
      title,
      excerpt,
      date: wpPost.date,
      image: image.url ? image : undefined,
      categories,
      tags,
      author: author ? { name: author.name, slug: author.slug, avatar: author.avatar } : undefined,
      readingTime,
    },
  };
}
```

- [ ] **Step 4: Add HTML entity decoder**

Add the `decodeHtmlEntities` function (copy from existing `transforms.ts`):

```ts
function decodeHtmlEntities(text: string): string {
  const entityMap: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
    "&#039;": "'", "&apos;": "'", "&nbsp;": " ",
    "&hellip;": "…", "&#8217;": "'", "&#8216;": "'",
    "&#8220;": "“", "&#8221;": "”",
    "&#8212;": "—", "&#8211;": "–",
  };
  let decoded = text;
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  return decoded;
}
```

- [ ] **Step 5: Rewrite `cachePosts()` — two-tier output**

Replace the existing `cachePosts()` body. Keep the fetch loop, slim, and author enrichment. Replace the output:

```ts
async function cachePosts() {
  const startTime = Date.now();
  try {
    console.log(`📝 Fetching up to ${TARGET} WordPress posts...`);

    const allPosts: WordPressPost[] = [];
    let page = 1;

    while (allPosts.length < TARGET) {
      const batch = await wpFetch<WordPressPost[]>(
        `/posts?_embed=${EMBED}&_fields=${FIELDS}&per_page=${PAGE_SIZE}&page=${page}&orderby=date&order=desc`
      );
      if (batch.length === 0) break;
      allPosts.push(...batch);
      console.log(`  Page ${page}: ${batch.length} posts (total: ${allPosts.length})`);
      if (batch.length < PAGE_SIZE) break;
      page++;
    }

    const slimmedPosts = allPosts.slice(0, TARGET).map(slimPost);

    // Enrich author descriptions (keep existing logic)
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

    // NEW: Transform and write two-tier cache
    const indexEntries: Record<string, unknown>[] = [];
    for (const wpPost of slimmedPosts) {
      const transformed = transformPost(wpPost);
      writePostCache(wpPost.slug, transformed.full);
      indexEntries.push(transformed.index);
    }

    // Write index
    writeIndexCache(indexEntries);

    const duration = Date.now() - startTime;
    console.log(`✅ Cached ${indexEntries.length} posts in ${duration}ms`);
    console.log(`   index.json: ${indexEntries.length} entries`);
    console.log(`   posts/: ${indexEntries.length} individual files`);
  } catch (error) {
    console.error("❌ Failed to cache WordPress posts:", error);
    process.exit(1);
  }
}
```

- [ ] **Step 6: Remove old `writeCachedPosts` import**

Replace the import from `../src/lib/wordpress/cache` — remove `writeCachedPosts` since we now use our own `writePostCache` and `writeIndexCache`. Keep only what's still needed (nothing if the in-memory cache module is also being simplified — but that's Task 2).

The import line becomes:
```ts
import { wpFetch } from "../src/lib/wordpress/client";
```

- [ ] **Step 7: Remove old `slimPost` content truncation**

In the existing `slimPost()` function, remove the line that truncates content:
```ts
// REMOVE this line:
if (rest.content?.rendered) {
  rest.content = { rendered: rest.content.rendered.slice(0, 3000) };
}
```

Full content is now preserved since each post gets its own file.

- [ ] **Step 8: Run the build script to verify**

```bash
cd apps/web && npx tsx scripts/cache-wordpress-posts.ts
```

Expected: generates `index.json` (~80KB) and `posts/` directory with ~400 JSON files.

- [ ] **Step 9: Commit**

```bash
git add apps/web/scripts/cache-wordpress-posts.ts
git commit -m "refactor: two-tier cache with pre-computed Turndown at build time"
```

---

### Task 2: Add `getPostBySlugLive` to WordPress fetch module

**Files:**
- Modify: `apps/web/src/lib/wordpress/fetch.ts`

**Interfaces:**
- Consumes: `wpFetch` (existing, same file)
- Produces: `fetchWordPressPostBySlugLive(slug: string): Promise<Post | null>`

This is a small, self-contained addition. We need a function that fetches ONE post from WordPress and transforms it at request time (for the SSR fallback). Unlike the cache path, this does need Turndown at runtime — but only for ONE post, not 400.

- [ ] **Step 1: Add `fetchAndTransformPost` function**

Add at the end of `fetch.ts`:

```ts
import { htmlToMarkdown, extractPlainText } from "./markdown";

export interface LivePost {
  slug: string;
  title: string;
  date: string;
  image: { url: string; alt: string };
  categories: { name: string; slug: string }[];
  author?: { name: string; slug: string; avatar: string; bio: string };
  body: string;
  markdown: string;
  plainText: string;
  readingTime: string;
  seo: { title: string; description: string };
}

export async function fetchAndTransformPost(slug: string): Promise<LivePost | null> {
  const posts = await wpFetch<WordPressPost[]>(
    `/posts?slug=${slug}&_embed&per_page=1`
  );
  if (posts.length === 0) return null;

  const wpPost = posts[0];

  // Decode entities
  const htmlContent = decodeHtmlEntities(wpPost.content.rendered);

  // Run Turndown for ONE post
  const markdown = htmlToMarkdown(htmlContent);
  const plainText = extractPlainText(htmlContent);
  const words = plainText.trim().split(/\s+/).length;
  const readingTime = `${Math.max(1, Math.ceil(words / 200))} min`;

  // Extract categories
  const categories: { name: string; slug: string }[] = [];
  if (wpPost._embedded?.["wp:term"]) {
    for (const termArray of wpPost._embedded["wp:term"]) {
      for (const term of termArray) {
        if (term.taxonomy === "category") {
          categories.push({ name: term.name, slug: term.slug });
        }
      }
    }
  }

  // Extract author
  const wpAuthor = wpPost._embedded?.author?.[0];
  const author = wpAuthor ? {
    name: wpAuthor.name,
    slug: wpAuthor.slug,
    avatar: wpAuthor.avatar_urls?.["96"] || "",
    bio: wpAuthor.description || "",
  } : undefined;

  // Featured image
  const featuredMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0];
  const image = featuredMedia ? {
    url: featuredMedia.source_url,
    alt: stripHtml(wpPost.title.rendered),
  } : { url: "", alt: "" };

  const title = stripHtml(wpPost.title.rendered);
  const excerpt = stripHtml(wpPost.excerpt.rendered).slice(0, 300);

  return {
    slug: wpPost.slug,
    title,
    date: wpPost.date,
    image,
    categories,
    author,
    body: htmlContent,
    markdown,
    plainText,
    readingTime,
    seo: { title: `${title} | Madavi`, description: excerpt },
  };
}
```

- [ ] **Step 2: Verify the import compiles**

```bash
cd apps/web && npx tsc --noEmit src/lib/wordpress/fetch.ts 2>&1 | head -20
```

Expected: no errors (or pre-existing errors only).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/wordpress/fetch.ts
git commit -m "feat: add fetchAndTransformPost for SSR fallback"
```

---

### Task 3: Rewrite data layer — thin read + live WP fetch

**Files:**
- Modify: `apps/web/src/lib/data.ts`

**Interfaces:**
- Consumes: `.cache/index.json`, `.cache/posts/{slug}.json`, `fetchAndTransformPost` from fetch.ts
- Produces: `getPosts()`, `getPostsByCategory()`, `getPostsByTag()`, `getPostsByAuthor()`, `getPostBySlug()`, `getPostBySlugLive()`, `getRecentLivePosts()`

- [ ] **Step 1: Define types and add cache file path resolution**

Replace the WordPress-related section at the top of data.ts (around the USE_WORDPRESS flag). Add:

```ts
import * as fs from "fs";
import * as path from "path";

// Cache paths — resolve at build time (apps/web) vs runtime (repo root)
const CACHE_DIR = [
  path.join(".cache"),
  path.join("apps", "web", ".cache"),
].find(fs.existsSync) ?? path.join(".cache");

const INDEX_FILE = path.join(CACHE_DIR, "index.json");
const POSTS_DIR = path.join(CACHE_DIR, "posts");

interface PostIndexEntry {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image?: { url: string; alt: string };
  categories: { name: string; slug: string }[];
  tags: string[];
  author?: { name: string; slug: string; avatar: string };
  readingTime: string;
}
```

- [ ] **Step 2: Add cache read helpers**

```ts
function readIndexCache(): PostIndexEntry[] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
}

function readPostCache(slug: string): Post | null {
  const file = path.join(POSTS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}
```

- [ ] **Step 3: Rewrite `getPosts()`**

Replace the existing `getPosts()` function:

```ts
export async function getPosts(limit?: number): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    return limit ? index.slice(0, limit) : index;
  } catch (error) {
    console.warn("Failed to read post index:", error);
    return [];
  }
}
```

- [ ] **Step 4: Rewrite `getPostsByCategory()`**

Replace the existing function:

```ts
export async function getPostsByCategory(
  categorySlug: string,
  limit?: number
): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    const filtered = index.filter((p) =>
      p.categories?.some((c) => c.slug === categorySlug)
    );
    return limit ? filtered.slice(0, limit) : filtered;
  } catch (error) {
    console.warn(`Failed to filter posts by category "${categorySlug}":`, error);
    return [];
  }
}
```

- [ ] **Step 5: Rewrite `getPostsByTag()`**

Tags are now in index.json — simple in-memory filter:

```ts
export async function getPostsByTag(tag: string): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    return index.filter((p) => p.tags?.includes(tag));
  } catch (error) {
    console.warn(`Failed to filter posts by tag "${tag}":`, error);
    return [];
  }
}
```

- [ ] **Step 6: Rewrite `getPostsByAuthor()`**

```ts
export async function getPostsByAuthor(
  authorSlug: string,
  limit?: number
): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    const filtered = index.filter((p) => p.author?.slug === authorSlug);
    return limit ? filtered.slice(0, limit) : filtered;
  } catch (error) {
    console.warn(`Failed to filter posts by author "${authorSlug}":`, error);
    return [];
  }
}
```

- [ ] **Step 7: Rewrite `getPostBySlug()`**

```ts
export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!USE_WORDPRESS) return null;
  try {
    return readPostCache(slug);
  } catch (error) {
    console.warn(`Failed to read post cache for "${slug}":`, error);
    return null;
  }
}
```

- [ ] **Step 8: Add `getPostBySlugLive()`**

```ts
export async function getPostBySlugLive(slug: string): Promise<Post | null> {
  if (!USE_WORDPRESS) return null;
  try {
    const { fetchAndTransformPost } = await import("./wordpress/fetch");
    const livePost = await fetchAndTransformPost(slug);
    if (!livePost) return null;

    // Convert LivePost to Post shape
    return {
      slug: livePost.slug,
      data: {
        title: livePost.title,
        description: livePost.seo.description,
        pubDate: new Date(livePost.date),
        tags: [],
        categories: livePost.categories,
        author: livePost.author,
        image: livePost.image,
      },
      body: livePost.body,
      markdown: livePost.markdown,
      plainText: livePost.plainText,
    };
  } catch (error) {
    console.warn(`Failed to fetch live post "${slug}" from WordPress:`, error);
    return null;
  }
}
```

- [ ] **Step 9: Add `getRecentLivePosts()` for index merging**

```ts
export async function getRecentLivePosts(
  count: number = 5
): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const { wpFetch } = await import("./wordpress/client");
    const wpPosts = await wpFetch<any[]>(
      `/posts?_embed&per_page=${count}&orderby=date&order=desc&_fields=id,slug,title,excerpt,date,_embedded`
    );

    return wpPosts.map((wpPost: any) => {
      const categories: { name: string; slug: string }[] = [];
      if (wpPost._embedded?.["wp:term"]) {
        for (const termArray of wpPost._embedded["wp:term"]) {
          for (const term of termArray) {
            if (term.taxonomy === "category") {
              categories.push({ name: term.name, slug: term.slug });
            }
          }
        }
      }

      const wpAuthor = wpPost._embedded?.author?.[0];
      const featuredMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0];

      const title = wpPost.title.rendered.replace(/<[^>]*>/g, "").trim();
      const excerpt = wpPost.excerpt.rendered.replace(/<[^>]*>/g, "").trim().slice(0, 300);
      const words = wpPost.content?.rendered?.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length || 0;
      const readingTime = `${Math.max(1, Math.ceil(words / 200))} min`;

      return {
        slug: wpPost.slug,
        title,
        excerpt,
        date: wpPost.date,
        image: featuredMedia ? { url: featuredMedia.source_url, alt: title } : undefined,
        categories,
        author: wpAuthor ? {
          name: wpAuthor.name,
          slug: wpAuthor.slug,
          avatar: wpAuthor.avatar_urls?.["96"] || "",
        } : undefined,
        readingTime,
      };
    });
  } catch (error) {
    console.warn("Failed to fetch recent live posts:", error);
    return [];
  }
}
```

- [ ] **Step 10: Remove old `transformWordPressPost` import from runtime path**

Remove the dynamic `await import("./wordpress/transforms")` lines from ALL functions. The transform is now only in the build script and `fetchAndTransformPost`.

- [ ] **Step 11: Verify no TypeScript errors**

```bash
cd apps/web && npx tsc --noEmit src/lib/data.ts 2>&1 | head -20
```

- [ ] **Step 12: Commit**

```bash
git add apps/web/src/lib/data.ts
git commit -m "refactor: thin data layer — reads two-tier cache, adds live WP fallback"
```

---

### Task 4: Update blog post detail — hybrid prerender + SSR fallback

**Files:**
- Modify: `apps/web/src/pages/blog/[...slug].astro`

**Interfaces:**
- Consumes: `getPostBySlug`, `getPostBySlugLive` from data.ts, `readIndexCache` (via data.ts)
- Produces: Pre-rendered HTML for cached posts, SSR fallback for new posts

- [ ] **Step 1: Rewrite frontmatter to use getStaticPaths + SSR fallback**

Replace the entire frontmatter:

```astro
---
export const prerender = true;
import SingleBlogLayout from "@/layouts/SingleBlogLayout.astro";
import { getPostBySlug, getPostBySlugLive, getPosts } from "@/lib/data";

export async function getStaticPaths() {
  const index = await getPosts();
  return index.map((entry) => ({
    params: { slug: entry.slug },
    props: { post: null },  // null → will be filled by getPostBySlug below
  }));
}

const { slug } = Astro.params;
const slugStr = Array.isArray(slug) ? slug[slug.length - 1] : slug;

// Try cache first, then live WP for new posts
const post = await getPostBySlug(slugStr!) ?? await getPostBySlugLive(slugStr!);

if (!post) {
  return Astro.redirect("/404");
}
---
```

- [ ] **Step 2: Update template props to match new Post shape**

The template currently uses `post.data.title`, `post.data.image`, etc. Check that the new `Post` shape returned by `getPostBySlug` and `getPostBySlugLive` matches. If the shape changed (e.g., `post.image` vs `post.data.image`), update the template references.

The current template in `SingleBlogLayout` expects:
- `post.data.title` → ensure `post.data.title` or update to `post.title`
- `post.data.image` → ensure `post.data.image` or update
- `post.body` → unchanged
- `post.data.categories` → unchanged
- `post.data.pubDate` → unchanged

**Important:** Check the existing `SingleBlogLayout` props interface before making changes. If the Post shape changed, update the layout props to match.

- [ ] **Step 3: Verify local dev server**

```bash
# Restart dev server and test:
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/blog/sample-post
# Expected: 200 for cached posts
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/blog/\[...slug\].astro
git commit -m "feat: hybrid prerender + SSR fallback for blog post detail"
```

---

### Task 5: Update blog index — light SSR with merged cache+live

**Files:**
- Modify: `apps/web/src/pages/blog/index.astro`

**Interfaces:**
- Consumes: `getPosts`, `getRecentLivePosts` from data.ts
- Produces: SSR page with merged cached + live recent posts

- [ ] **Step 1: Update frontmatter to merge cache + live data**

Replace the existing frontmatter (keep the import of BaseLayout, components, etc.):

```astro
---
export const prerender = false;
import BaseLayout from "@/layouts/BaseLayout.astro";
import Wrapper from "@/components/fundations/containers/Wrapper.astro";
import { getPosts, getRecentLivePosts } from "@/lib/data";

// Existing component imports...
import BlogFeatured from "@/components/blog/landing/BlogFeatured.astro";
// ... keep all existing imports ...

// Merge cached index + live recent posts
const cachedPosts = await getPosts();
const livePosts = await getRecentLivePosts(5);

// Deduplicate: live posts that aren't in cache get added to front
const cachedSlugs = new Set(cachedPosts.map(p => p.slug));
const newPosts = livePosts.filter(p => !cachedSlugs.has(p.slug));
const allPosts = [...newPosts, ...cachedPosts];

const seo = {
  title: "Blog and Insights",
  description: "Read insights and articles about AI consulting, digital transformation, and business strategy from Madavi.",
  type: "website" as const,
};
---
```

- [ ] **Step 2: Pass merged posts to components**

Each blog component (BlogFeatured, AIStudioBlog, etc.) currently calls `getPosts()` or `getPostsByCategory()` internally. These components need to accept posts as a prop instead of fetching internally.

Update each component to accept `posts: PostIndexEntry[]` as a prop and remove the internal `getPosts()` call.

For example, `BlogFeatured.astro` changes from:
```astro
---
import { getPosts } from "@/lib/data";
const allPosts = await getPosts();
---
```
To:
```astro
---
import type { PostIndexEntry } from "@/lib/data";
const { posts } = Astro.props as { posts: PostIndexEntry[] };
---
```

And the template passes:
```astro
<BlogFeatured posts={allPosts} />
```

**This affects these components:**
- `BlogFeatured.astro`
- `AIStudioBlog.astro`
- `GrowthMarketingBlog.astro`
- `ContentMarketingBlog.astro`
- `SeoMarketingBlog.astro`
- `WebDesignBlog.astro`
- `Aside1.astro`
- `Categories1.astro`
- `Categories2.astro`

- [ ] **Step 3: Filter per component in the template**

In the index page template, filter `allPosts` before passing to each component:

```astro
<BlogFeatured posts={allPosts.slice(0, 1)} />
<AIStudioBlog posts={allPosts.filter(p => p.categories?.some(c => c.slug === 'the-ai-studio'))} />
<GrowthMarketingBlog posts={allPosts.filter(p => p.categories?.some(c => c.slug === 'growth-marketing'))} />
<!-- etc. -->
```

- [ ] **Step 4: Verify local dev server**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/blog
# Expected: 200
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/blog/index.astro apps/web/src/components/blog/landing/*.astro
git commit -m "refactor: blog index SSR with merged cache+live, components accept props"
```

---

### Task 6: Update category, tag, and author routes

**Files:**
- Modify: `apps/web/src/pages/blog/cat/[...category].astro`
- Modify: `apps/web/src/pages/blog/tags/[tag].astro`
- Modify: `apps/web/src/pages/blog/author/[...username].astro`

**Interfaces:**
- Consumes: `getPostsByCategory`, `getPostsByTag`, `getPostsByAuthor`, `getRecentLivePosts` from data.ts
- Produces: SSR pages with merged data

- [ ] **Step 1: Update category route**

```astro
---
export const prerender = false;
import { getPostsByCategory, getRecentLivePosts } from "@/lib/data";

const category = Array.isArray(Astro.params.category)
  ? Astro.params.category[Astro.params.category.length - 1]
  : Astro.params.category;

const cachedPosts = await getPostsByCategory(category!);
const livePosts = await getRecentLivePosts(5);
const cachedSlugs = new Set(cachedPosts.map(p => p.slug));
const newPosts = livePosts.filter(p =>
  !cachedSlugs.has(p.slug) &&
  p.categories?.some(c => c.slug === category)
);
const allPosts = [...newPosts, ...cachedPosts];
---
```

- [ ] **Step 2: Update tag route**

Same pattern as category, using `getPostsByTag`. Keep existing if it already works with the new data layer.

- [ ] **Step 3: Update author route**

Same pattern, using `getPostsByAuthor`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/blog/cat/ apps/web/src/pages/blog/tags/ apps/web/src/pages/blog/author/
git commit -m "refactor: category/tag/author routes use new data layer with live merge"
```

---

### Task 7: Clean up — remove Turndown from runtime deps, update netlify.toml

**Files:**
- Modify: `apps/web/src/lib/wordpress/transforms.ts`
- Modify: `netlify.toml`

- [ ] **Step 1: Verify no runtime Turndown imports**

```bash
grep -rn "turndown\|TurndownService\|htmlToMarkdown" apps/web/src/lib/data.ts apps/web/src/components/ apps/web/src/pages/ --include="*.ts" --include="*.astro" | grep -v "node_modules" | grep -v "scripts/"
```

Expected: no matches (except in `scripts/cache-wordpress-posts.ts` and `fetch.ts` which is intentional for single-post SSR fallback).

- [ ] **Step 2: Simplify transforms.ts**

The `transformWordPressPost` function is no longer used at runtime. Mark it as `@deprecated` and add a comment:

```ts
/**
 * @deprecated Use the build script (cache-wordpress-posts.ts) for bulk transforms.
 * For single-post live fetches, use fetchAndTransformPost() from fetch.ts.
 */
export function transformWordPressPost(wpPost: WordPressPost): Post {
  // ... keep existing code for backward compatibility
}
```

- [ ] **Step 3: Update netlify.toml — add function timeout**

```toml
[functions]
  node_bundler = "esbuild"

[functions."blog-*"]
  external_node_modules = []
```

Remove the generic `[functions]` section if it exists (Task 7 replaces it). Add:

```toml
[functions]
  node_bundler = "esbuild"
```

The esbuild bundler is faster and produces smaller bundles than the default. The `@astrojs/netlify` adapter handles the rest.

- [ ] **Step 4: Remove `prerender = false` debugging artifacts**

Verify no debug `console.log` statements remain in blog page frontmatter.

- [ ] **Step 5: Full build test**

```bash
cd apps/web && pnpm build 2>&1 | tail -20
```

Expected: build succeeds, no Turndown errors at runtime.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/wordpress/transforms.ts netlify.toml
git commit -m "chore: clean up runtime Turndown, update netlify function config"
```

---

### Task 8: End-to-end verification

- [ ] **Step 1: Start dev server and test all routes**

```bash
# Restart dev server
for route in "/blog" "/blog/sample-post" "/blog/cat/growth-marketing" "/blog/tags/photography" "/blog/author/amukune"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4321$route")
  echo "$code $route"
done
```

Expected: all 200.

- [ ] **Step 2: Verify cache files are generated correctly**

```bash
ls -lh apps/web/.cache/index.json
ls apps/web/.cache/posts/ | wc -l
cat apps/web/.cache/index.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} entries, {len(d[0].keys())} fields per entry')"
```

- [ ] **Step 3: Push and verify Netlify deploy preview**

```bash
git push origin amukune-pipeline
```

Check the Netlify deploy preview — `/blog` should load without crashing.

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final verification fixes"
```
