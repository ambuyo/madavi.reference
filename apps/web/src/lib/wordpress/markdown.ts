/**
 * Markdown conversion utilities.
 *
 * Turndown is loaded via top-level await. On Cloudflare Workers, turndown's
 * internal require('@mixmark-io/domino') crashes the import, which is caught
 * and turndownService stays null. htmlToMarkdown() then returns "" safely.
 * On Node.js/VPS, turndown works normally.
 */

let turndownService: any = null;

try {
  const TurndownService = (await import("turndown")).default;
  turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    linkStyle: "inlined",
  });

  turndownService.addRule("strikethrough", {
    filter: ["del", "s"],
    replacement: (content: string) => `~~${content}~~`,
  });

  turndownService.addRule("wordpressCaption", {
    filter: (node: any) =>
      node.tagName === "FIGURE" && node.classList.contains("wp-caption"),
    replacement: (content: string, node: any) => {
      const img = node.querySelector("img");
      const figcaption = node.querySelector("figcaption");
      if (img && figcaption) {
        return `![${figcaption.textContent}](${img.src})\n*${figcaption.textContent}*\n`;
      }
      return content;
    },
  });

  turndownService.addRule("wordpressGallery", {
    filter: (node: any) =>
      node.tagName === "DIV" && node.classList.contains("wp-block-gallery"),
    replacement: (content: string, node: any) => {
      const images = node.querySelectorAll("img");
      const alt = images[0]?.alt || "Gallery";
      return `\n**Gallery**\n${Array.from(images)
        .map((img: any) => `- ![${img.alt}](${img.src})`)
        .join("\n")}\n`;
    },
  });
} catch (error) {
  // Cloudflare Workers: turndown internally calls require('@mixmark-io/domino')
  // which doesn't exist in Workers. Markdown conversion is disabled.
  console.warn("[markdown] Turndown unavailable (expected on Workers), markdown disabled:", (error as Error).message);
}

// Convert HTML to Markdown (sync — turndown loaded at module init via top-level await)
export function htmlToMarkdown(html: string): string {
  if (!turndownService) return ""; // Workers fallback
  try {
    let markdown = turndownService.turndown(html);
    markdown = markdown
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+$/gm, "")
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
