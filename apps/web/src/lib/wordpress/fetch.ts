import { wpFetch } from "./client";

// Configuration
const R2_CDN_URL = import.meta.env.PUBLIC_R2_CDN_URL || "https://images.madavi.co";

// R2 Image optimization parameters
const IMAGE_TRANSFORMS = {
  quality: 80,
  formats: ['webp', 'avif'],
  densities: [1, 2]
};

// Types
export interface WPFeaturedImage {
  urls: {
    full: string;
    large: string;
    medium_large: string;
    medium: string;
    thumbnail: string;
  };
  srcset: string;
  sizes: string;
  alt: string;
  title: string;
  width: number;
  height: number;
  is_r2: boolean;
  optimized?: {
    webp: string;
    original: string;
    srcset: string;
  };
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number;
}

export interface WordPressPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  date: string;
  modified: string;
  featured_media: number;
  categories?: number[];
  featured_image_urls?: WPFeaturedImage;
  content_images?: Array<{
    url: string;
    is_r2: boolean;
  }>;
  acf?: {
    key_entities?: string[];
    topics?: string[];
    tldr_summary?: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
    author?: Array<{
      name: string;
      slug: string;
      description?: string;
      avatar_urls?: { "24"?: string; "48"?: string; "96"?: string };
    }>;
    "wp:term"?: Array<Array<{
      id: number;
      name: string;
      slug: string;
      taxonomy: string;
      parent: number;
    }>>;
  };
}

export interface WordPressImage {
  id: number;
  source_url: string;
  alt_text: string;
}

// Fetch all blog posts from WordPress
export async function fetchWordPressPosts(limit = 400): Promise<WordPressPost[]> {
  const PAGE_SIZE = 100;
  const allPosts: WordPressPost[] = [];
  let page = 1;

  while (allPosts.length < limit) {
    const batch = await wpFetch<WordPressPost[]>(
      `/posts?_embed&per_page=${PAGE_SIZE}&page=${page}&orderby=date&order=desc`
    );
    if (batch.length === 0) break;
    allPosts.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    page++;
  }

  return allPosts.slice(0, limit);
}

// Map category slugs to WordPress category IDs
const categorySlugToId: Record<string, number> = {
  "company-updates": 240,
  "hcaif": 1041,
  "human-centric-ai": 1042,
  "content-marketing": 241,
  "growth-marketing": 238,
  "decision-infrastructure": 1043,
};

// Fetch posts by category slug
export async function fetchWordPressPostsByCategory(
  categorySlug: string
): Promise<WordPressPost[]> {
  const categoryId = categorySlugToId[categorySlug];

  if (!categoryId) {
    console.warn(`Category slug "${categorySlug}" not found in mapping`);
    return [];
  }

  return wpFetch<WordPressPost[]>(
    `/posts?categories=${categoryId}&_embed&per_page=100&orderby=date&order=desc`
  );
}

// Fetch single post by slug
export async function fetchWordPressPostBySlug(
  slug: string
): Promise<WordPressPost | null> {
  const posts = await wpFetch<WordPressPost[]>(
    `/posts?slug=${slug}&_embed`
  );
  return posts.length > 0 ? posts[0] : null;
}

// Fetch category by slug
export async function fetchWordPressCategoryBySlug(
  slug: string
): Promise<WordPressCategory | null> {
  try {
    const categories = await wpFetch<Array<WordPressCategory & { description: string }>>(
      `/categories?slug=${slug}`
    );
    return categories.length > 0 ? categories[0] : null;
  } catch (error) {
    console.warn(`Failed to fetch category "${slug}":`, error);
    return null;
  }
}

// Get featured image from embedded data
export function getFeaturedImage(post: WordPressPost) {
  const images = post._embedded?.["wp:featuredmedia"];
  if (images && images.length > 0) {
    return {
      url: images[0].source_url,
      alt: images[0].alt_text || post.title.rendered,
    };
  }
  return {
    url: "",
    alt: post.title.rendered,
  };
}

// Decode HTML entities properly
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
    "&#8220;": "“",
    "&#8221;": "”",
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

// Extract plain text from HTML
export function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .trim()
  );
}

// Check if URL is already on R2 CDN
export function isR2Image(url: string): boolean {
  return url.includes("images.madavi.co") || url.includes("cdn.madavi.co");
}

// Get optimized image URL with Cloudflare transforms
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    format?: "webp" | "avif" | "auto";
    quality?: number;
  } = {}
): string {
  if (!isR2Image(url)) {
    return url;
  }

  const format = options.format || "auto";
  const quality = options.quality || IMAGE_TRANSFORMS.quality;
  const params = [];

  if (options.width) {
    params.push(`width=${options.width}`);
  }
  if (format !== "auto") {
    params.push(`format=${format}`);
  }
  params.push(`quality=${quality}`);

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${params.join("&")}`;
}

// Generate responsive srcset for images
export function generateSrcSet(url: string, widths: number[] = [640, 1024, 1536]): string {
  if (!isR2Image(url)) {
    return url;
  }

  return widths
    .map((width) => `${getOptimizedImageUrl(url, { width, format: "webp" })} ${width}w`)
    .join(", ");
}

// Extract plain text from WordPress HTML
export function extractPlainText(html: string): string {
  return stripHtml(html);
}

// Verify R2 integration is working
export function verifyR2Integration(): boolean {
  return !!R2_CDN_URL && R2_CDN_URL.includes("madavi.co");
}
