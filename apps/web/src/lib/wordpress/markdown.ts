import TurndownService from "turndown";

// Build a TurndownService with all custom WordPress rules applied
// (strikethrough, wp-caption, gallery). Shared by the build script
// (cache-wordpress-posts.ts) and the live single-post fetch
// (fetchAndTransformPost) so every path produces the same markdown.
export function configureTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    linkStyle: "inlined",
  });

  // Configure custom rules for better markdown output
  service.addRule("strikethrough", {
    filter: ["del", "s"],
    replacement: (content) => `~~${content}~~`,
  });

  service.addRule("wordpressCaption", {
    filter: (node) =>
      node.tagName === "FIGURE" &&
      node.classList.contains("wp-caption"),
    replacement: (content, node) => {
      const img = node.querySelector("img");
      const figcaption = node.querySelector("figcaption");
      if (img && figcaption) {
        return `![${figcaption.textContent}](${img.src})\n*${figcaption.textContent}*\n`;
      }
      return content;
    },
  });

  service.addRule("wordpressGallery", {
    filter: (node) =>
      node.tagName === "DIV" &&
      node.classList.contains("wp-block-gallery"),
    replacement: (content, node) => {
      const images = node.querySelectorAll("img");
      const alt = images[0]?.alt || "Gallery";
      return `\n**Gallery**\n${Array.from(images)
        .map((img) => `- ![${img.alt}](${img.src})`)
        .join("\n")}\n`;
    },
  });

  return service;
}

const turndownService = configureTurndown();

// Convert HTML to Markdown
export function htmlToMarkdown(html: string): string {
  try {
    let markdown = turndownService.turndown(html);

    // Clean up excessive whitespace
    markdown = markdown
      .replace(/\n{3,}/g, "\n\n") // Max 2 newlines
      .replace(/[ \t]+$/gm, "") // Trailing whitespace
      .trim();

    return markdown;
  } catch (error) {
    console.warn("Error converting HTML to Markdown, returning plain text:", error);
    return stripHtml(html);
  }
}

// Extract plain text from HTML
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

// Extract plain text with better formatting
export function extractPlainText(html: string): string {
  return stripHtml(html)
    .replace(/&hellip;/g, "…")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8212;/g, "—")
    .replace(/&#8211;/g, "–");
}

// Rewrite internal cms.madavi.co hrefs to madavi.co paths
export function rewriteCmsDomainLinks(html: string): string {
  return html.replace(
    /href="https?:\/\/cms\.madavi\.co(\/[^"]*)"/g,
    (match, path) => {
      // Leave wp-* and feed paths as-is (admin, API, media served from CMS)
      if (/^\/(wp-content|wp-admin|wp-json|wp-login|feed)\b/.test(path)) return match;

      // /category/slug → /blog/cat/slug
      const catMatch = path.match(/^\/category\/([^/?#]+)/);
      if (catMatch) return `href="/blog/cat/${catMatch[1].replace(/\/$/, '')}"`;

      // /tag/slug → /blog/tag/slug
      const tagMatch = path.match(/^\/tag\/([^/?#]+)/);
      if (tagMatch) return `href="/blog/tag/${tagMatch[1].replace(/\/$/, '')}"`;

      // /author/slug → /blog (no author archive pages in Astro)
      if (/^\/author\//.test(path)) return `href="/blog"`;

      // Everything else treated as a post slug: /slug/ → /blog/slug
      const clean = path.replace(/^\//, "").replace(/\/$/, "");
      return clean ? `href="/blog/${clean}"` : `href="/blog"`;
    }
  );
}
