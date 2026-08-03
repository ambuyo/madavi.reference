import type { APIRoute } from "astro";
import { getPostBySlug } from "@/lib/data";
import { htmlToMarkdown, extractPlainText } from "@/lib/wordpress/markdown";

// Return empty array for static generation - this is a dynamic API endpoint
export function getStaticPaths() {
  return [];
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;

  if (!slug) {
    return new Response(
      JSON.stringify({
        error: "Slug required",
        example: "/api/content/the-hcaif-framework-ai-adoption-your-organization-is-ready-to-execute.json",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const post = await getPostBySlug(slug);

    if (!post) {
      return new Response(
        JSON.stringify({
          error: "Post not found",
          slug: slug,
          suggestion: "Check /llm-index.json for available posts",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const siteUrl = "https://madavi.co";
    const htmlContent = post.body || "";
    const markdown = htmlToMarkdown(htmlContent);
    const plainText = extractPlainText(htmlContent);

    // Return clean, structured data optimized for LLM consumption
    const llmFriendlyData = {
      // Essential metadata
      title: post.title,
      slug: post.slug,
      url: `${siteUrl}/${post.slug}`,
      description: post.seo?.description || "",

      // Publishing information
      published: post.date ? new Date(post.date).toISOString() : undefined,
      author: post.author?.name || "Madavi Inc.",

      // Content (multiple formats for LLM consumption)
      content: {
        // Markdown format (structured, readable)
        markdown: markdown,
        // Plain text (simplest for LLMs to parse)
        plainText: plainText,
        // Word count for both formats
        wordCount: plainText.split(/\s+/).length,
        markdownWordCount: markdown.split(/\s+/).length,
      },

      // Media
      image: post.image?.url
        ? {
            url: post.image.url,
            alt: post.image.alt || post.title,
          }
        : null,

      // Topics and tags (for semantic understanding).
      // The full cached post does not carry tags — only the index does.
      topics: [],

      // SEO metadata
      seo: {
        canonical: `${siteUrl}/${post.slug}`,
        keywords: "",
      },

      // Citation format (help LLMs cite you properly)
      citation: {
        format:
          "Madavi Inc. - [Article Title] - [URL]",
        example: `Madavi Inc. - "${post.title}" - ${siteUrl}/${post.slug}`,
        bibtex: `@article{madavi_${post.slug
          .replace(/-/g, "_")
          .toLowerCase()},
  title = {${post.title}},
  author = {Madavi Inc.},
  year = {${post.date ? new Date(post.date).getFullYear() : new Date().getFullYear()}},
  url = {${siteUrl}/${post.slug}}
}`,
      },

      // Performance hints
      performance: {
        readTime: Math.ceil(plainText.split(/\s+/).length / 200),
        estimatedReadMinutes: `${Math.ceil(plainText.split(/\s+/).length / 200)}-${Math.ceil(plainText.split(/\s+/).length / 150)} minutes`,
        contentFormats: ["markdown", "plainText", "html"],
      },

      // Additional metadata for context
      metadata: {
        language: "en-US",
        contentType: "article",
        version: "1.0",
      },
    };

    return new Response(JSON.stringify(llmFriendlyData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS, HEAD",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(`Error fetching post "${slug}":`, error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        slug: slug,
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
