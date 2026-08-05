// SSR blog sitemap — generates XML entries for all blog posts,
// categories, authors, and tags. These pages are not prerendered
// so @astrojs/sitemap cannot discover them at build time.

export async function GET() {
  const BASE = "https://madavi.co";

  try {
    const [
      { readCachedTransformedPosts },
      { getCachedAllCategories },
      { getCachedAllTags },
    ] = await Promise.all([
      import("../lib/wordpress/cache"),
      import("../lib/wordpress/cache"),
      import("../lib/wordpress/cache"),
    ]);

    const posts = await readCachedTransformedPosts();
    const categories = await getCachedAllCategories();
    const tags = await getCachedAllTags();

    const urls: string[] = [];

    // Blog index
    urls.push(`<url><loc>${BASE}/blog</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`);

    // Individual blog posts
    if (posts) {
      for (const post of posts) {
        const lastmod = post.data.pubDate
          ? new Date(post.data.pubDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        urls.push(
          `<url><loc>${BASE}/blog/${post.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`
        );
      }

      // Collect unique author slugs from posts
      const authorSlugs = new Set<string>();
      for (const post of posts) {
        if (post.data.author?.slug) authorSlugs.add(post.data.author.slug);
      }
      for (const slug of authorSlugs) {
        urls.push(
          `<url><loc>${BASE}/blog/author/${slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
        );
      }
    }

    // Category pages
    for (const cat of categories) {
      urls.push(
        `<url><loc>${BASE}/blog/cat/${cat.slug}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      );
    }

    // Tag pages
    for (const tag of tags) {
      urls.push(
        `<url><loc>${BASE}/blog/tags/${tag}</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>`
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[blog-sitemap] Failed to generate:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    );
  }
}
