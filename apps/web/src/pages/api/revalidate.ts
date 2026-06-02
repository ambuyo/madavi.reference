import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const secret = request.headers.get("x-webhook-secret") || url.searchParams.get("secret");
  if (!secret || secret !== import.meta.env.WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { wpFetch } = await import("@/lib/wordpress/client");
    const { setMemoryPosts } = await import("@/lib/wordpress/cache");

    const FIELDS = ["id", "slug", "date", "title", "excerpt", "content", "_links", "_embedded"].join(",");
    const EMBED = "wp:featuredmedia,author,wp:term";

    const allPosts: any[] = [];
    let page = 1;

    while (allPosts.length < 200) {
      const batch = await wpFetch<any[]>(
        `/posts?_embed=${EMBED}&_fields=${FIELDS}&per_page=100&page=${page}&orderby=date&order=desc`
      );
      if (batch.length === 0) break;
      allPosts.push(...batch);
      if (batch.length < 100) break;
      page++;
    }

    setMemoryPosts(allPosts.slice(0, 200));

    console.log(`[revalidate] Cache updated — ${allPosts.length} posts`);

    return new Response(
      JSON.stringify({ success: true, posts: allPosts.length, timestamp: new Date().toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[revalidate] Failed to refresh cache:", error);
    return new Response(JSON.stringify({ error: "Failed to refresh cache" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
