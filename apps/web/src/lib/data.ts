/**
 * Central Data Utility
 *
 * This module provides a unified interface for fetching data from either
 * Content Collections or Sanity CMS. The data source is controlled by
 * the USE_SANITY flag.
 *
 * Usage:
 *   import { getPosts, getServices, ... } from "@/lib/data";
 *
 * When USE_SANITY is false (default):
 *   - Data comes from src/content/**
 *   - No Sanity code is loaded or executed
 *   - No Sanity env vars required
 *
 * When USE_SANITY is true:
 *   - Data comes from Sanity CMS
 *   - Requires SANITY_PROJECT_ID in apps/web/.env
 */

import { getCollection, getEntry, render } from "astro:content";

// Import types statically (no runtime cost)
import type {
  Post,
  TeamMember,
  Service,
  Industry,
  SingleWork,
  InfoPage,
} from "./sanity/types";

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Toggle between Content Collections and Sanity CMS
 * Set to true to use Sanity, false to use Content Collections
 */
export const USE_SANITY = true;

/**
 * Toggle WordPress fetch for blog posts
 * Set to false to disable WordPress API calls during development
 */
export const USE_WORDPRESS = true;

// =============================================================================
// LAZY SANITY IMPORTS
// =============================================================================

/**
 * Dynamically import Sanity modules only when needed
 * This ensures no Sanity code is bundled when USE_SANITY is false
 */
async function getSanityModules() {
  const [
    { sanityFetch },
    {
      allPostsQuery,
      postBySlugQuery,
      postsByTagQuery,
      allTagsQuery,
      allCategoriesQuery,
      allSubcategoriesQuery,
      postsByCategorySlugQuery,
      postsBySubcategorySlugQuery,
      allTeamMembersQuery,
      teamMemberBySlugQuery,
      allServicesQuery,
      serviceBySlugQuery,
      allIndustriesQuery,
      industryBySlugQuery,
      allCaseStudiesQuery,
      caseStudyBySlugQuery,
      allInfoPagesQuery,
      infoPageBySlugQuery,
    },
    {
      transformPost,
      transformTeamMember,
      transformService,
      transformIndustry,
      transformSingleWork,
      transformInfoPage,
    },
  ] = await Promise.all([
    import("./sanity/fetch"),
    import("./sanity/queries"),
    import("./sanity/transforms"),
  ]);

  return {
    sanityFetch,
    queries: {
      allPostsQuery,
      postBySlugQuery,
      postsByTagQuery,
      allTagsQuery,
      allCategoriesQuery,
      allSubcategoriesQuery,
      postsByCategorySlugQuery,
      postsBySubcategorySlugQuery,
      allTeamMembersQuery,
      teamMemberBySlugQuery,
      allServicesQuery,
      serviceBySlugQuery,
      allIndustriesQuery,
      industryBySlugQuery,
      allCaseStudiesQuery,
      caseStudyBySlugQuery,
      allInfoPagesQuery,
      infoPageBySlugQuery,
    },
    transforms: {
      transformPost,
      transformTeamMember,
      transformService,
      transformIndustry,
      transformSingleWork,
      transformInfoPage,
    },
  };
}

// =============================================================================
// WORDPRESS CACHE — THIN READ LAYER
// =============================================================================

import * as fs from "fs";
import * as path from "path";

// Cache paths — resolve at build time (apps/web) vs runtime (repo root)
const CACHE_DIR = [
  path.join(".cache"),
  path.join("apps", "web", ".cache"),
  // Netlify: cache is copied into dist/ during build so the function can read it
  path.join("dist", ".cache"),
  path.join("apps", "web", "dist", ".cache"),
].find(fs.existsSync) ?? path.join(".cache");

const INDEX_FILE = path.join(CACHE_DIR, "index.json");
const POSTS_DIR = path.join(CACHE_DIR, "posts");

/**
 * Lightweight index entry written by scripts/cache-wordpress-posts.ts.
 * Consumed by list views (blog index, category/tag/author pages).
 */
export interface PostIndexEntry {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  image?: { url: string; alt: string };
  categories: { name: string; slug: string }[];
  tags: string[];
  author?: { name: string; slug: string; avatar: string };
  readingTime: string;
}

/**
 * Full cached post written to posts/{slug}.json by
 * scripts/cache-wordpress-posts.ts. Flat — no `data` wrapper — matching
 * the LivePost shape from lib/wordpress/fetch.ts so cached and live posts
 * can be consumed identically.
 */
export interface CachedPost {
  slug: string;
  title: string;
  date: string;
  image: { url: string; alt: string };
  categories: { name: string; slug: string }[];
  author?: { name: string; slug: string; avatar: string; bio: string };
  body: string;
  markdown: string;
  plainText: string;
  readingTime: string;
  seo: { title: string; description: string };
}

function readIndexCache(): PostIndexEntry[] {
  if (!fs.existsSync(INDEX_FILE)) return [];
  return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
}

function readPostCache(slug: string): CachedPost | null {
  const file = path.join(POSTS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// =============================================================================
// POSTS
// =============================================================================

/**
 * Get all posts from the build-time index cache.
 * Instant, no network — new posts appear after a rebuild/redeploy.
 */
export async function getPosts(limit?: number): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    return limit ? index.slice(0, limit) : index;
  } catch (error) {
    console.warn("Failed to read post index:", error);
    return [];
  }
}

/**
 * Get posts by category slug from the index cache.
 */
export async function getPostsByCategory(
  categorySlug: string,
  limit?: number
): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    const filtered = index.filter((p) =>
      p.categories?.some((c) => c.slug === categorySlug)
    );
    return limit ? filtered.slice(0, limit) : filtered;
  } catch (error) {
    console.warn(`Failed to filter posts by category "${categorySlug}":`, error);
    return [];
  }
}

/**
 * Get posts by tag slug from the index cache.
 */
export async function getPostsByTag(tag: string): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    return index.filter((p) => p.tags?.includes(tag));
  } catch (error) {
    console.warn(`Failed to filter posts by tag "${tag}":`, error);
    return [];
  }
}

/**
 * Get posts by author slug from the index cache.
 */
export async function getPostsByAuthor(
  authorSlug: string,
  limit?: number
): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    const filtered = index.filter((p) => p.author?.slug === authorSlug);
    return limit ? filtered.slice(0, limit) : filtered;
  } catch (error) {
    console.warn(`Failed to filter posts by author "${authorSlug}":`, error);
    return [];
  }
}

/**
 * Get a single post by slug from the per-post cache files.
 * Full body/markdown is pre-computed at build time — no Turndown at runtime.
 */
export async function getPostBySlug(slug: string): Promise<CachedPost | null> {
  if (!USE_WORDPRESS) return null;
  try {
    return readPostCache(slug);
  } catch (error) {
    console.warn(`Failed to read post cache for "${slug}":`, error);
    return null;
  }
}

/**
 * SSR fallback: fetch ONE post live from WordPress and transform it at
 * request time. Used for posts published after the last cache build.
 * Returns the Post shape with the same fields consumers expect from
 * cached posts (markdown via the same pipeline as the build script).
 */
export async function getPostBySlugLive(slug: string): Promise<Post | null> {
  if (!USE_WORDPRESS) return null;
  try {
    const { fetchAndTransformPost } = await import("./wordpress/fetch");
    const livePost = await fetchAndTransformPost(slug);
    if (!livePost) return null;

    // Convert LivePost to Post shape
    return {
      slug: livePost.slug,
      data: {
        title: livePost.title,
        description: livePost.seo.description,
        pubDate: new Date(livePost.date),
        tags: [],
        // Post.data.categories requires an `id` — index/live posts don't carry one
        categories: livePost.categories.map((c) => ({ ...c, id: 0 })),
        author: livePost.author,
        image: livePost.image,
      },
      body: livePost.body,
      markdown: livePost.markdown,
      plainText: livePost.plainText,
    };
  } catch (error) {
    console.warn(`Failed to fetch live post "${slug}" from WordPress:`, error);
    return null;
  }
}

/**
 * Fetch the N most recent posts live from WordPress, shaped like index
 * entries. Used to merge brand-new posts (absent from the cache) into
 * list pages without a rebuild.
 */
export async function getRecentLivePosts(
  count: number = 5
): Promise<PostIndexEntry[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const { wpFetch } = await import("./wordpress/client");
    const wpPosts = await wpFetch<any[]>(
      `/posts?_embed&per_page=${count}&orderby=date&order=desc&_fields=id,slug,title,excerpt,date,_embedded`
    );

    return wpPosts.map((wpPost: any) => {
      const categories: { name: string; slug: string }[] = [];
      if (wpPost._embedded?.["wp:term"]) {
        for (const termArray of wpPost._embedded["wp:term"]) {
          for (const term of termArray) {
            if (term.taxonomy === "category") {
              categories.push({ name: term.name, slug: term.slug });
            }
          }
        }
      }

      const wpAuthor = wpPost._embedded?.author?.[0];
      const featuredMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0];

      const title = wpPost.title.rendered.replace(/<[^>]*>/g, "").trim();
      const excerpt = wpPost.excerpt.rendered.replace(/<[^>]*>/g, "").trim().slice(0, 300);
      const words = wpPost.content?.rendered?.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length || 0;
      const readingTime = `${Math.max(1, Math.ceil(words / 200))} min`;

      return {
        slug: wpPost.slug,
        title,
        excerpt,
        date: wpPost.date,
        // PostIndexEntry.tags is required; the live _fields payload omits terms
        tags: [],
        image: featuredMedia ? { url: featuredMedia.source_url, alt: title } : undefined,
        categories,
        author: wpAuthor ? {
          name: wpAuthor.name,
          slug: wpAuthor.slug,
          avatar: wpAuthor.avatar_urls?.["96"] || "",
        } : undefined,
        readingTime,
      };
    });
  } catch (error) {
    console.warn("Failed to fetch recent live posts:", error);
    return [];
  }
}

/**
 * Get all unique tags from the index cache — WordPress only
 */
export async function getAllTags(): Promise<string[]> {
  if (!USE_WORDPRESS) return [];
  try {
    const index = readIndexCache();
    const tags = new Set<string>();
    index.forEach((p) => p.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  } catch (error) {
    console.warn("Failed to read tags from post index:", error);
    return [];
  }
}

// Helper to clean WordPress editor attributes from HTML
function cleanWordPressHtml(html: string): string {
  return html
    .replace(/\s+data-path-to-node="[^"]*"/g, "")
    .replace(/\s+data-index-in-node="[^"]*"/g, "")
    .trim();
}

/**
 * Get category description by slug (WordPress)
 */
export async function getCategoryDescription(
  categorySlug: string
): Promise<string | null> {
  if (!USE_WORDPRESS) {
    return null;
  }

  try {
    const { wpFetch } = await import("./wordpress/client");
    const categories = await wpFetch<
      Array<{ id: number; name: string; slug: string; description: string }>
    >(`/categories?slug=${encodeURIComponent(categorySlug)}`);

    if (categories.length > 0 && categories[0].description) {
      return cleanWordPressHtml(categories[0].description);
    }
  } catch (error) {
    console.warn(
      `Failed to fetch category description for "${categorySlug}":`,
      error
    );
  }

  return null;
}

// =============================================================================
// TEAM MEMBERS
// =============================================================================

/**
 * Get all team members
 */
export async function getTeamMembers(limit?: number): Promise<TeamMember[]> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const members = await sanityFetch<any[]>(queries.allTeamMembersQuery);
      const result = members.map(transforms.transformTeamMember);
      return limit ? result.slice(0, limit) : result;
    } catch (error) {
      console.error("Failed to fetch team members from Sanity:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  const members = await getCollection("team");
  return members.map((member) => ({
    slug: member.id,
    data: {
      name: member.data.name,
      role: member.data.role,
      bio: member.data.bio,
      image: member.data.image,
      socials: member.data.socials,
    },
    render: () => render(member),
  }));
}

/**
 * Get a single team member by slug
 */
export async function getTeamMemberBySlug(
  slug: string
): Promise<TeamMember | null> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const member = await sanityFetch<any>(queries.teamMemberBySlugQuery, {
        slug,
      });
      return member ? transforms.transformTeamMember(member) : null;
    } catch (error) {
      console.error(`Failed to fetch team member "${slug}" from Sanity:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  const entry = await getEntry("team", slug);
  if (!entry) return null;
  return {
    slug: entry.id,
    data: {
      name: entry.data.name,
      role: entry.data.role,
      bio: entry.data.bio,
      image: entry.data.image,
      socials: entry.data.socials,
    },
    render: () => render(entry),
  };
}

// =============================================================================
// SERVICES
// =============================================================================

/**
 * Get all services
 */
export async function getServices(limit?: number): Promise<Service[]> {
  try {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const services = await sanityFetch<any[]>(queries.allServicesQuery);
    const result = services.filter(Boolean).map(transforms.transformService).filter((s: any) => s?.slug);
    return limit ? result.slice(0, limit) : result;
  } catch (error) {
    console.error("Failed to fetch services from Sanity:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Get a single service by slug
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const service = await sanityFetch<any>(queries.serviceBySlugQuery, { slug });
    return service ? transforms.transformService(service) : null;
  } catch (error) {
    console.error(`Failed to fetch service "${slug}" from Sanity:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// =============================================================================
// INDUSTRIES
// =============================================================================

/**
 * Get all industries
 */
export async function getIndustries(limit?: number): Promise<Industry[]> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const industries = await sanityFetch<any[]>(queries.allIndustriesQuery);
      const result = industries
        .map(transforms.transformIndustry)
        .filter(industry => industry.slug !== null && industry.slug !== undefined);
      return limit ? result.slice(0, limit) : result;
    } catch (error) {
      console.error("Failed to fetch industries from Sanity:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  const industries = await getCollection("industries");
  return industries.map((industry) => ({
    slug: industry.data.slug || industry.id,
    data: {
      title: industry.data.title,
      summary: industry.data.summary,
      description: industry.data.description,
      seo: industry.data.seo,
      og: industry.data.og,
      twitter: industry.data.twitter,
      hero: industry.data.hero,
      threeTierProblems: industry.data.threeTierProblems,
      benefits: industry.data.benefits,
      valueProposition: industry.data.valueProposition,
      roi: industry.data.roi,
      blog: industry.data.blog,
      faqs: industry.data.faqs,
      painPoints: industry.data.painPoints,
      relevantServices: industry.data.relevantServices,
      image: industry.data.image,
    },
    render: () => render(industry),
  }));
}

/**
 * Get a single industry by slug
 */
export async function getIndustryBySlug(
  slug: string
): Promise<Industry | null> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const industry = await sanityFetch<any>(queries.industryBySlugQuery, {
        slug,
      });
      return industry ? transforms.transformIndustry(industry) : null;
    } catch (error) {
      console.error(`Failed to fetch industry "${slug}" from Sanity:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  const industries = await getCollection("industries");
  const industry = industries.find((ind) => ind.data.slug === slug || ind.id === slug);

  if (!industry) return null;

  return {
    slug: industry.data.slug || industry.id,
    data: {
      title: industry.data.title,
      summary: industry.data.summary,
      description: industry.data.description,
      seo: industry.data.seo,
      og: industry.data.og,
      twitter: industry.data.twitter,
      hero: industry.data.hero,
      threeTierProblems: industry.data.threeTierProblems,
      benefits: industry.data.benefits,
      valueProposition: industry.data.valueProposition,
      roi: industry.data.roi,
      blog: industry.data.blog,
      faqs: industry.data.faqs,
      painPoints: industry.data.painPoints,
      relevantServices: industry.data.relevantServices,
      image: industry.data.image,
    },
    render: () => render(industry),
  };
}

// =============================================================================
// CASE STUDIES
// =============================================================================

/**
 * Get all single works
 */
export async function getOurWork(limit?: number): Promise<SingleWork[]> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const caseStudies = await sanityFetch<any[]>(queries.allCaseStudiesQuery);
      const result = caseStudies
        .filter(Boolean)
        .map(transforms.transformSingleWork)
        .filter((cs: any) => cs?.slug && cs?.data?.client);
      return limit ? result.slice(0, limit) : result;
    } catch (error) {
      console.error("Failed to fetch case studies from Sanity:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  const caseStudies = await getCollection("caseStudies");
  return caseStudies
    .filter((caseStudy: any) => caseStudy?.data?.image && caseStudy?.data?.industry)
    .map((caseStudy: any) => ({
      slug: caseStudy.id,
      data: {
        client: caseStudy.data.client,
        industry: caseStudy.data.industry,
        imcServices: caseStudy.data.imcServices || [],
        aiStudioServices: caseStudy.data.aiStudioServices || [],
        services: [...(caseStudy.data.imcServices || []), ...(caseStudy.data.aiStudioServices || [])],
        completionDate: (caseStudy.data as any).completionDate,
        aboutClient: caseStudy.data.aboutClient,
        ourProcess: caseStudy.data.ourProcess,
        results: caseStudy.data.results,
        businessImpact: caseStudy.data.businessImpact,
        testimonial: caseStudy.data.testimonial,
        year: caseStudy.data.year,
        tagline: caseStudy.data.tagline,
        projectUrl: caseStudy.data.projectUrl,
        image: caseStudy.data.image,
        projectImages: caseStudy.data.projectImages,
        pubDate: caseStudy.data.pubDate,
      },
      render: () => render(caseStudy),
    }));
}

/**
 * Get a single work by slug
 */
export async function getSingleWorkBySlug(
  slug: string
): Promise<SingleWork | null> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const caseStudy = await sanityFetch<any>(queries.caseStudyBySlugQuery, {
        slug,
      });
      return caseStudy ? transforms.transformSingleWork(caseStudy) : null;
    } catch (error) {
      console.error(`Failed to fetch case study "${slug}" from Sanity:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  const entry = await getEntry("caseStudies", slug);
  if (!entry) return null;
  return {
    slug: entry.id,
    data: {
      client: entry.data.client,
      industry: entry.data.industry,
      imcServices: (entry.data as any).imcServices || [],
      aiStudioServices: (entry.data as any).aiStudioServices || [],
      services: [...((entry.data as any).imcServices || []), ...((entry.data as any).aiStudioServices || [])],
      completionDate: (entry.data as any).completionDate,
      aboutClient: entry.data.aboutClient,
      ourProcess: entry.data.ourProcess,
      results: entry.data.results,
      businessImpact: entry.data.businessImpact,
      testimonial: entry.data.testimonial,
      year: entry.data.year,
      tagline: entry.data.tagline,
      projectUrl: entry.data.projectUrl,
      image: entry.data.image,
      projectImages: entry.data.projectImages,
      pubDate: entry.data.pubDate,
    },
    render: () => render(entry),
  };
}

// =============================================================================
// INFO PAGES (Legal/Privacy/Terms)
// =============================================================================

/**
 * Get all info pages
 */
export async function getInfoPages(): Promise<InfoPage[]> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const pages = await sanityFetch<any[]>(queries.allInfoPagesQuery);
      return pages.map(transforms.transformInfoPage);
    } catch (error) {
      console.error("Failed to fetch info pages from Sanity:", error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  const pages = await getCollection("infopages");
  return pages.map((page) => ({
    slug: page.id,
    data: {
      page: page.data.page,
      pubDate: page.data.pubDate,
    },
    render: () => render(page),
  }));
}

/**
 * Get a single info page by slug
 */
export async function getInfoPageBySlug(
  slug: string
): Promise<InfoPage | null> {
  if (USE_SANITY) {
    try {
      const { sanityFetch, queries, transforms } = await getSanityModules();
      const page = await sanityFetch<any>(queries.infoPageBySlugQuery, { slug });
      return page ? transforms.transformInfoPage(page) : null;
    } catch (error) {
      console.error(`Failed to fetch info page "${slug}" from Sanity:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  const entry = await getEntry("infopages", slug);
  if (!entry) return null;
  return {
    slug: entry.id,
    data: {
      page: entry.data.page,
      pubDate: entry.data.pubDate,
    },
    render: () => render(entry),
  };
}

// =============================================================================
// FAQS
// =============================================================================

export interface FAQ {
  id: string;
  question: string;
  shortTitle: string;
  shortAnswer: string;
  fullAnswer: string;
}

export interface FAQCollection {
  title: string;
  description: string;
  slug: string;
  faqs: FAQ[];
}

/**
 * Get FAQs by slug (from content collections)
 */
export async function getFAQsBySlug(slug: string): Promise<FAQCollection | null> {
  try {
    // First, try to get from the faqs content collection root
    const allFAQs = await getCollection("faqs");
    const faqEntry = allFAQs.find((faq) => faq.data.slug === slug);

    if (faqEntry) {
      return {
        title: faqEntry.data.title,
        description: faqEntry.data.description,
        slug: faqEntry.data.slug,
        faqs: faqEntry.data.faqs || [],
      };
    }
  } catch (error) {
    console.warn(`Failed to fetch FAQs for slug "${slug}":`, error);
  }

  return null;
}

// =============================================================================
// EXPORT TYPES FOR COMPONENTS
// =============================================================================

export type {
  Post,
  TeamMember,
  Service,
  Industry,
  SingleWork,
  InfoPage,
  Category,
  Subcategory,
} from "./sanity/types";
