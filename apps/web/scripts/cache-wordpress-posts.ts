// Build-time script to fetch and cache WordPress posts
// Run this before deploying to ensure posts are up-to-date
import TurndownService from "turndown";
import * as path from "path";
import * as fs from "fs";
import { wpFetch } from "../src/lib/wordpress/client";
import type { WordPressPost } from "../src/lib/wordpress/fetch";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  linkStyle: "inlined",
});

// NOTE: import.meta.dirname instead of __dirname — this package is "type": "module"
// (ESM), where __dirname is undefined. Same value: apps/web/scripts.
const CACHE_DIR = path.join(import.meta.dirname, "..", ".cache");
const POSTS_DIR = path.join(CACHE_DIR, "posts");

const TARGET = 400;
const PAGE_SIZE = 100;

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

// Transform a slimmed WP post into the two-tier cache shapes.
// Runs Turndown (HTML→Markdown) ONCE per post, at build time — never at runtime.
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

function slimPost(post: WordPressPost): WordPressPost {
  const { _links, ...rest } = post as any;

  // Strip excerpt HTML down to rendered text only
  if (rest.excerpt?.rendered) {
    rest.excerpt = { rendered: rest.excerpt.rendered.slice(0, 500) };
  }

  if (rest._embedded) {
    // Author: keep only name, slug, avatar_urls
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

cachePosts();
