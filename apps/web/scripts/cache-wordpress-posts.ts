// Build-time script to fetch and cache WordPress posts
// Run this before deploying to ensure posts are up-to-date
import { wpFetch } from "../src/lib/wordpress/client";
import { writeCachedPosts } from "../src/lib/wordpress/cache";
import type { WordPressPost } from "../src/lib/wordpress/fetch";

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

function slimPost(post: WordPressPost): WordPressPost {
  const { _links, ...rest } = post as any;

  // Truncate content — only used for reading-time estimation, full HTML not needed
  if (rest.content?.rendered) {
    rest.content = { rendered: rest.content.rendered.slice(0, 3000) };
  }

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

    const posts = allPosts.slice(0, TARGET).map(slimPost);
    await writeCachedPosts(posts);

    const duration = Date.now() - startTime;
    console.log(`✅ Cached ${posts.length} WordPress posts in ${duration}ms`);
    console.log(`📊 Cache will be used for instant page loads until next redeploy`);
  } catch (error) {
    console.error("❌ Failed to cache WordPress posts:", error);
    process.exit(1);
  }
}

cachePosts();
