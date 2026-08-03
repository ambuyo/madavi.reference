# Blog Architecture — Optimized Prerender + SSR Fallback

**Date:** 2026-08-03
**Status:** Approved
**Approach:** A (hybrid prerender + SSR fallback)

## Problem

The blog crashes on Netlify (`This function has crashed`) because:

1. **1.9MB JSON cache** read synchronously into memory on every cold start
2. **10 components** on `/blog` each call `getPosts()` or `getPostsByCategory()`, each reading the full cache
3. **Turndown (HTML→Markdown)** runs at render time on hundreds of posts per page render
4. **Dual storage** — each post stores both raw HTML body AND generated markdown
5. **Content truncated** to 3000 chars in cache, losing long-form article bodies
6. **Hardcoded category slug→ID mapping** requires code changes for new WP categories

## Design

### Two-tier cache

Replace the single 1.9MB `wordpress-posts.json` with:

```
.cache/
  index.json          ~80KB  — 400 posts × ~200 bytes each
  posts/
    {slug}.json       ~3KB   — one file per post, full pre-computed content
```

**`index.json`** — minimal fields for listing pages:
```json
[
  {
    "slug": "post-slug",
    "title": "Post Title",
    "excerpt": "Short excerpt...",
    "date": "2026-08-01",
    "image": { "url": "...", "alt": "..." },
    "categories": [{ "name": "AI", "slug": "ai" }],
    "author": { "name": "...", "slug": "...", "avatar": "..." },
    "readingTime": "3 min"
  }
]
```

**`posts/{slug}.json`** — full post, pre-computed at build:
```json
{
  "slug": "post-slug",
  "title": "Post Title",
  "date": "2026-08-01",
  "image": { "url": "...", "alt": "..." },
  "categories": [{ "name": "AI", "slug": "ai" }],
  "author": { "name": "...", "slug": "...", "avatar": "...", "bio": "..." },
  "body": "<h2>Heading</h2><p>Text...</p>",
  "markdown": "## Heading\n\nText...",
  "plainText": "Heading Text...",
  "readingTime": "3 min",
  "seo": { "title": "...", "description": "..." }
}
```

### Build script (`cache-wordpress-posts.ts`)

```
fetch 400 posts from WordPress
  ↓
for each post:
  - strip unused WP fields (keep existing slimPost logic)
  - run Turndown ONCE: HTML → markdown + plainText
  - compute readingTime from plainText word count
  - extract seo title/description
  - write posts/{slug}.json  (full pre-computed post)
  - push slim index entry to array (title, excerpt, image, categories, author, readingTime)
  ↓
write index.json (all index entries)
```

- Turndown runs only in this script, never at render time
- No content truncation — per-post files have no size pressure
- Runs at build time via `pnpm build` (already wired: `tsx scripts/cache-wordpress-posts.ts && astro build`)

### Data layer (`data.ts`)

Thin read layer. No Turndown, no in-memory cache, no category ID mapping.

```ts
// Reads index.json (~80KB) — instant
getPosts(limit?) → PostIndexEntry[]

// Filters index.json in memory — fast, 80KB
getPostsByCategory(slug, limit?) → PostIndexEntry[]

// Reads single post file (~3KB)
getPostBySlug(slug) → Post | null

// NEW: fetches ONE post live from WordPress for SSR fallback
getPostBySlugLive(slug) → Post | null
```

`getPostBySlugLive()` hits the WordPress REST API for a single post by slug — ~200ms, well within Netlify's 10s timeout.

### Rendering strategy

| Route | Strategy | Details |
|-------|----------|---------|
| `/blog` | SSR | Reads index.json (80KB) + 1 WP call for 5 most recent posts. Merges cached + live. 10 components filter same in-memory array. ~500ms |
| `/blog/[...slug]` | Hybrid | Prerender all cached slugs from index.json. SSR fallback for new posts: fetches one post from WP live (~200ms) |
| `/blog/cat/[...category]` | SSR | Filters index.json by category slug + 1 WP call for recent in that category |
| `/blog/tags/[tag]` | SSR | Filters index.json by tag slug |
| `/blog/author/[...username]` | SSR | Filters index.json by author slug |

**New article flow:**
```
WordPress publish
  ↓
/blog/my-new-post  →  not in index.json → SSR fallback → fetches from WP → renders (~200ms)
/blog              →  SSR: 80KB index + 1 WP call for recent → merged → renders (~500ms)
```

### What's removed

- 1.9MB in-memory cache with TTL
- `transformWordPressPost()` from render path
- Turndown from all runtime code (lives only in build script)
- Category ID hardcoding — index.json stores category slug directly
- HTML body from cache — replaced by pre-computed markdown

### Webhook

WordPress publish triggers Netlify Build Hook → full redeploy → new posts move from SSR fallback to static CDN. 2-minute delay. Not required for new posts to appear (SSR fallback handles that) — the redeploy just moves them to the faster static path and updates the index.

## Implementation plan

1. **Rewrite `cache-wordpress-posts.ts`** — two-tier output, Turndown at build time, no content truncation
2. **Rewrite `data.ts` blog functions** — thin read layer, add `getPostBySlugLive()`
3. **Update `[...slug].astro`** — prerender cached paths + SSR fallback for new slugs
4. **Update `/blog` index** — SSR with merged cached + live recent posts
5. **Update category/tag/author routes** — SSR with index.json filtering
6. **Remove Turndown from runtime deps** — verify no component or data module imports it
7. **Update `netlify.toml`** — ensure function timeout covers SSR paths
