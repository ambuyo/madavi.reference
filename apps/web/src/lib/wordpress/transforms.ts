import {
  WordPressPost,
  WordPressCategory,
  getFeaturedImage,
  stripHtml,
} from "./fetch";
import { htmlToMarkdown, extractPlainText } from "./markdown";
import type { Post } from "../sanity/types";

// Helper to extract top-level categories (parent === 0) from embedded data
function extractCategories(wpPost: WordPressPost): WordPressCategory[] {
  if (!wpPost._embedded?.["wp:term"]) {
    return [];
  }

  const categories: WordPressCategory[] = [];
  for (const termArray of wpPost._embedded["wp:term"]) {
    for (const term of termArray) {
      if (term.taxonomy === "category" && term.parent === 0) {
        categories.push({ id: term.id, name: term.name, slug: term.slug, parent: 0 });
      }
    }
  }

  return categories;
}

// Helper to extract subcategories (parent > 0) from embedded data
function extractSubcategories(wpPost: WordPressPost): Array<{ id: number; name: string; slug: string; parentId: number }> {
  if (!wpPost._embedded?.["wp:term"]) {
    return [];
  }

  const subcategories: Array<{ id: number; name: string; slug: string; parentId: number }> = [];
  for (const termArray of wpPost._embedded["wp:term"]) {
    for (const term of termArray) {
      if (term.taxonomy === "category" && term.parent > 0) {
        subcategories.push({ id: term.id, name: term.name, slug: term.slug, parentId: term.parent });
      }
    }
  }

  return subcategories;
}

// Helper to decode HTML entities in content
function decodeHtmlEntities(text: string): string {
  const entityMap: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&hellip;": "…",
    "&#8217;": "'",
    "&#8216;": "'",
    "&#8220;": String.fromCharCode(8220),
    "&#8221;": String.fromCharCode(8221),
    "&#8212;": "—",
    "&#8211;": "–",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }

  // Handle numeric entities &#XXXX;
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  // Handle hex entities &#xXXXX;
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

// Transform WordPress post to our Post type
export function transformWordPressPost(wpPost: WordPressPost): Post {
  const featuredImage = getFeaturedImage(wpPost);
  const htmlContent = decodeHtmlEntities(wpPost.content.rendered);
  const markdown = htmlToMarkdown(htmlContent);
  const plainText = extractPlainText(htmlContent);
  const categories = extractCategories(wpPost);
  const subcategories = extractSubcategories(wpPost);

  return {
    slug: wpPost.slug,
    data: {
      title: stripHtml(wpPost.title.rendered),
      description: stripHtml(wpPost.excerpt.rendered),
      pubDate: new Date(wpPost.date),
      tags: [],
      categories,
      subcategories: subcategories.length > 0 ? subcategories : undefined,
      team: undefined,
      image: {
        url: featuredImage.url,
        alt: featuredImage.alt,
      },
    },
    body: htmlContent,
    markdown: markdown,
    plainText: plainText,
  };
}
