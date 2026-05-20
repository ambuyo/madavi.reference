// Build-time script to fetch and cache WordPress posts
// Run this before deploying to ensure posts are up-to-date
import { wpFetch } from "../src/lib/wordpress/client";
import { writeCachedPosts } from "../src/lib/wordpress/cache";
import type { WordPressPost } from "../src/lib/wordpress/fetch";

async function cachePosts() {
  const startTime = Date.now();
  try {
    console.log("📝 Fetching WordPress posts...");
    const posts = await wpFetch<WordPressPost[]>(
      "/posts?_embed&per_page=100&orderby=date&order=desc"
    );

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
