/**
 * Markdown conversion utilities.
 *
 * Turndown is loaded via top-level await on platforms where it can work.
 *
 * Turndown needs one of two things internally:
 *   1. `window.DOMParser` (browser / DOM environment), or
 *   2. `require("@mixmark-io/domino")` (Node.js fallback)
 *
 * Cloudflare Workers ESM has NEITHER: `window` is undefined and `require`
 * doesn't exist.  If we import turndown there, its module-level init runs
 * `createHTMLParser()` → `require("@mixmark-io/domino")` → crashes with
 * "ReferenceError: require is not defined".
 *
 * We guard with a pre-flight check so the import is never attempted on
 * Workers.  On VPS (Node) and in the browser, turndown loads and works
 * normally.
 */

const isNode = typeof process !== "undefined" && process.versions?.node;
const isBrowser = typeof window !== "undefined";
const supportsTurndown = isNode || isBrowser;

let turndownService: any = null;

if (supportsTurndown) {
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
        return `\n**Gallery**\n${Array.from(images)
          .map((img: any) => `- ![${img.alt}](${img.src})`)
          .join("\n")}\n`;
      },
    });
  } catch (error) {
    console.warn(
      "[markdown] Turndown unavailable, markdown disabled:",
      (error as Error).message,
    );
  }
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
    console.warn(
      "Error converting HTML to Markdown, returning plain text:",
      error,
    );
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
