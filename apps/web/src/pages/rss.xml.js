/* global console */
import rss from "@astrojs/rss";

export async function GET(context) {
  let items = [];

  try {
    const { readCachedTransformedPosts } =
      await import("../lib/wordpress/cache");

    const posts = await readCachedTransformedPosts();
    if (posts && posts.length > 0) {
      items = posts.slice(0, 100).map((post) => {
        const categories = post.data.categories?.map((c) => c.name) ?? [];
        const tags = post.data.tags ?? [];
        const author = post.data.author?.name;

        let description = post.data.description || "";
        // Use plain text excerpt for RSS description (strip any remaining HTML)
        if (post.plainText) {
          description = post.plainText.slice(0, 500);
        }

        return {
          title: post.data.title,
          link: `/blog/${post.slug}`,
          pubDate: post.data.pubDate,
          description,
          categories: [...categories, ...tags],
          author,
          customData: author
            ? `<dc:creator><![CDATA[${author}]]></dc:creator>`
            : undefined,
        };
      });
    }
  } catch (error) {
    if (typeof console !== "undefined" && typeof console.error !== "undefined")
      console.error("[rss] Failed to load posts from cache:", error);
    // Return empty feed rather than failing
  }

  return rss({
    title: "Madavi Blog",
    description:
      "Insights on AI advisory, growth marketing, content strategy, and human-centric AI integration from Madavi Inc.",
    site: context.site || "https://madavi.co",
    items,
    customData: `<language>en-us</language>`,
  });
}
