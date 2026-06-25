/**
 * Dynamic search API endpoint.
 *
 * Parses ?q= query parameter and searches across both WordPress
 * (cached blog posts) and Sanity (services, industries, case studies).
 * Designed for edge runtimes — pure fetch-based, no filesystem.
 *
 * GET /api/search?q=ai+strategy
 *
 * Cache-Control: public, s-maxage=60 (1 min edge cache)
 */
import type { APIRoute } from "astro";

interface SearchResult {
  title: string;
  description: string;
  slug: string;
  url: string;
  type: "blog" | "service" | "industry" | "case-study" | "team" | "info-page";
  category?: string;
  pubDate?: string;
}

const SITE = "https://madavi.co";

/**
 * Simple relevance scorer: counts keyword matches in title + description.
 * Falls back to date recency for tie-breaking.
 */
function scoreResult(result: SearchResult, query: string): number {
  const terms = query.toLowerCase().split(/\s+/);
  const haystack = `${result.title} ${result.description} ${result.category || ""}`.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (result.title.toLowerCase().includes(term)) score += 10;
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = haystack.match(regex);
    if (matches) score += matches.length * 2;
  }
  return score;
}

export const GET: APIRoute = async ({ request, url: requestUrl }) => {
  const q = requestUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return new Response(JSON.stringify({ results: [], query: q || "" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  }

  try {
    const results: SearchResult[] = [];

    // ── 1. Search WordPress cached posts ──────────────────────────
    try {
      const { readCachedPosts } = await import("@/lib/wordpress/cache");
      const cachedPosts = await readCachedPosts();

      if (cachedPosts) {
        for (const post of cachedPosts) {
          const title = post.title?.rendered || "";
          const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "") || "";
          const categories = post._embedded?.["wp:term"]
            ?.flat()
            ?.filter((t: any) => t.taxonomy === "category")
            ?.map((t: any) => t.name) || [];

          results.push({
            title,
            description: excerpt.slice(0, 200),
            slug: post.slug,
            url: `${SITE}/blog/${post.slug}`,
            type: "blog",
            category: categories[0],
            pubDate: post.date,
          });
        }
      }
    } catch (err) {
      console.warn("[search] WordPress search skipped:", err);
    }

    // ── 2. Search Sanity content ──────────────────────────────────
    try {
      const { sanityFetch } = await import("@/lib/sanity/fetch");

      // Services
      const services = await sanityFetch<any[]>(
        `*[_type == "service" && defined(slug.current)] {
          title, "slug": slug.current, summary, "category": "Service"
        }`
      );
      if (Array.isArray(services)) {
        for (const s of services) {
          results.push({
            title: s.title || "",
            description: (s.summary || "").slice(0, 200),
            slug: s.slug,
            url: `${SITE}/services/${s.slug}`,
            type: "service",
            category: s.category,
          });
        }
      }

      // Industries
      const industries = await sanityFetch<any[]>(
        `*[_type == "industry" && defined(slug.current)] {
          title, "slug": slug.current, summary, "category": "Industry"
        }`
      );
      if (Array.isArray(industries)) {
        for (const ind of industries) {
          results.push({
            title: ind.title || "",
            description: (ind.summary || "").slice(0, 200),
            slug: ind.slug,
            url: `${SITE}/industries/${ind.slug}`,
            type: "industry",
            category: ind.category,
          });
        }
      }

      // Case studies
      const caseStudies = await sanityFetch<any[]>(
        `*[_type == "singleWork" && defined(slug.current)] {
          title, "slug": slug.current, summary, "category": coalesce(industry, "Case Study")
        }`
      );
      if (Array.isArray(caseStudies)) {
        for (const cs of caseStudies) {
          results.push({
            title: cs.title || "",
            description: (cs.summary || "").slice(0, 200),
            slug: cs.slug,
            url: `${SITE}/work/${cs.slug}`,
            type: "case-study",
            category: cs.category,
          });
        }
      }
    } catch (err) {
      console.warn("[search] Sanity search skipped:", err);
    }

    // ── 3. Score and sort results ─────────────────────────────────
    const scored = results
      .map((r) => ({ result: r, score: scoreResult(r, q) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.result)
      .slice(0, 20);

    return new Response(
      JSON.stringify({ results: scored, query: q, total: scored.length }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[search] Error:", error);
    return new Response(
      JSON.stringify({ results: [], query: q, error: "Search failed" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=10",
        },
      }
    );
  }
};
