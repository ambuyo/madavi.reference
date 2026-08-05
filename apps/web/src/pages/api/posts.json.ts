import { readCachedTransformedPosts } from "../../lib/wordpress/cache";

export async function GET() {
  try {
    const transformedPosts = await readCachedTransformedPosts();

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
