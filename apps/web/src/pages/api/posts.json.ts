import { readCachedPosts } from "../../lib/wordpress/cache";
import { transformWordPressPost } from "../../lib/wordpress/transforms";

export async function GET() {
  try {
    const cachedPosts = await readCachedPosts();

    if (!cachedPosts || cachedPosts.length === 0) {
      return new Response(JSON.stringify({ posts: [], error: "No cached posts available" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes if empty
        },
      });
    }

    const transformedPosts = cachedPosts.map(transformWordPressPost);

    return new Response(JSON.stringify({ posts: transformedPosts }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache for 24 hours (posts updated at deploy time)
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error serving posts:", error);
    return new Response(JSON.stringify({ posts: [], error: "Failed to serve posts" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  }
}
