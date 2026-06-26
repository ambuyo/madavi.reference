import { getCollection } from "astro:content";

export async function GET() {
  try {
    const faqs = await getCollection("faqs");
    const posts = await getCollection("posts");

    return new Response(JSON.stringify({
      success: true,
      faqs: {
        count: faqs.length,
        entries: faqs.map(entry => ({ slug: entry.data.slug, title: entry.data.title }))
      },
      posts: {
        count: posts.length,
        entries: posts.map(entry => ({ slug: (entry as Record<string, unknown>).slug as string || entry.id, title: entry.data.title }))
      }
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, null, 2), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
