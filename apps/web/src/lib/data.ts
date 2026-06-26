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
  Category,
  Subcategory,
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
 * Returns null if Sanity is not configured (missing env vars)
 */
async function getSanityModules() {
  try {
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
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`Sanity unavailable (${msg}) — using empty data for all CMS-driven pages.`);
    return null;
  }
}

// =============================================================================
// POSTS
// =============================================================================

/**
 * Get all posts — reads from pre-transformed cache for instant loading.
 * Posts are transformed once at cache-load time, so all listing pages
 * share the same Turndown pass.
 */
export async function getPosts(limit?: number) {
  if (!USE_WORDPRESS) {
    return [];
  }

  try {
    const { readCachedTransformedPosts } = await import("./wordpress/cache");

    const transformed = await readCachedTransformedPosts();
    if (transformed && transformed.length > 0) {
      return limit ? transformed.slice(0, limit) : transformed;
    }

    // Cache miss entirely — fetch fresh and transform (first boot only)
    const { fetchWordPressPosts } = await import("./wordpress/fetch");
    const { transformWordPressPost } = await import("./wordpress/transforms");
    const rawPosts = await fetchWordPressPosts(limit ?? 2000);
    return rawPosts.map(transformWordPressPost);
  } catch (error) {
    console.warn("Failed to load posts from cms.madavi.co:", error);
    return [];
  }
}

/**
 * Get a single post by slug.
 * Looks up the slug index first (O(1)), falls back to live WP API.
 * With full content in cache (Phase 1.4), cache hits are now the common case.
 */
export async function getPostBySlug(slug: string) {
  if (!USE_WORDPRESS) {
    return null;
  }

  try {
    // 1. Try cache index first (O(1) lookup)
    const { getCachedPostBySlug } = await import("./wordpress/cache");
    const cached = await getCachedPostBySlug(slug);

    if (cached) {
      const { transformWordPressPost } = await import("./wordpress/transforms");
      return transformWordPressPost(cached);
    }

    // 2. Not in cache — fetch live (new post, not yet cached)
    const { fetchWordPressPostBySlug } = await import("./wordpress/fetch");
    const { transformWordPressPost } = await import("./wordpress/transforms");
    const post = await fetchWordPressPostBySlug(slug);
    if (post) {
      return transformWordPressPost(post);
    }

    console.warn(`Post "${slug}" not found`);
  } catch (error) {
    console.warn(`Failed to get post "${slug}":`, error);
  }

  return null;
}

/**
 * Get posts by tag — reads from cache index, transforms only matching posts.
 */
export async function getPostsByTag(tag: string): Promise<Post[]> {
  try {
    const { getCachedPostsByTag } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");
    const matched = await getCachedPostsByTag(tag);
    return matched.map(transformWordPressPost);
  } catch {
    return [];
  }
}

/**
 * Get posts by category slug — reads from cache index, transforms only matching posts.
 */
export async function getPostsByCategory(categorySlug: string, limit?: number): Promise<Post[]> {
  try {
    const { getCachedPostsByCategory } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");
    const matched = await getCachedPostsByCategory(categorySlug);
    const sliced = limit ? matched.slice(0, limit) : matched;
    return sliced.map(transformWordPressPost);
  } catch (error) {
    console.warn(`Failed to fetch posts from category "${categorySlug}":`, error);
    return [];
  }
}

/**
 * Get posts by subcategory slug — reads from cache index.
 */
export async function getPostsBySubcategory(subcategorySlug: string): Promise<Post[]> {
  try {
    const { getCachedPostsByCategory } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");
    const matched = await getCachedPostsByCategory(subcategorySlug);
    return matched.map(transformWordPressPost);
  } catch (error) {
    console.warn(`Failed to fetch posts from subcategory "${subcategorySlug}":`, error);
    return [];
  }
}

/**
 * Get posts by author slug — reads from cache index, transforms only matching posts.
 */
export async function getPostsByAuthor(authorSlug: string, limit?: number): Promise<Post[]> {
  try {
    const { getCachedPostsByAuthor } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");
    const matched = await getCachedPostsByAuthor(authorSlug);
    const sliced = limit ? matched.slice(0, limit) : matched;
    return sliced.map(transformWordPressPost);
  } catch (error) {
    console.warn(`Failed to fetch posts by author "${authorSlug}":`, error);
    return [];
  }
}

/**
 * Get all unique tags — reads from pre-built index, no transforms needed.
 */
export async function getAllTags(): Promise<string[]> {
  try {
    const { getCachedAllTags } = await import("./wordpress/cache");
    return await getCachedAllTags();
  } catch {
    return [];
  }
}

/**
 * Get all categories — reads from pre-built index, no transforms needed.
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const { getCachedAllCategories } = await import("./wordpress/cache");
    return await getCachedAllCategories();
  } catch (error) {
    console.warn("Failed to get categories:", error);
    return [];
  }
}

/**
 * Get all subcategories — reads from pre-built index, no transforms needed.
 */
export async function getAllSubcategories(): Promise<Subcategory[]> {
  try {
    const { getCachedAllSubcategories } = await import("./wordpress/cache");
    return await getCachedAllSubcategories();
  } catch (error) {
    console.warn("Failed to get subcategories:", error);
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
    const modules = await getSanityModules();
    if (!modules) return [];
    const { sanityFetch, queries, transforms } = modules;
    const members = await sanityFetch<any[]>(queries.allTeamMembersQuery);
    const result = members.map(transforms.transformTeamMember);
    return limit ? result.slice(0, limit) : result;
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
    const modules = await getSanityModules();
    if (!modules) return null;
    const { sanityFetch, queries, transforms } = modules;
    const member = await sanityFetch<any>(queries.teamMemberBySlugQuery, {
      slug,
    });
    return (member && !Array.isArray(member)) ? transforms.transformTeamMember(member) : null;
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
  const modules = await getSanityModules();
  if (!modules) return [];
  const { sanityFetch, queries, transforms } = modules;
  const services = await sanityFetch<any[]>(queries.allServicesQuery);
  const result = services.filter(Boolean).map(transforms.transformService).filter((s: any) => s?.slug);
  return limit ? result.slice(0, limit) : result;
}

/**
 * Get a single service by slug
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const modules = await getSanityModules();
  if (!modules) return null;
  const { sanityFetch, queries, transforms } = modules;
  const service = await sanityFetch<any>(queries.serviceBySlugQuery, { slug });
  return (service && !Array.isArray(service)) ? transforms.transformService(service) : null;
}

// =============================================================================
// INDUSTRIES
// =============================================================================

/**
 * Get all industries
 */
export async function getIndustries(limit?: number): Promise<Industry[]> {
  if (USE_SANITY) {
    const modules = await getSanityModules();
    if (!modules) return [];
    const { sanityFetch, queries, transforms } = modules;
    const industries = await sanityFetch<any[]>(queries.allIndustriesQuery);
    const result = industries
      .map(transforms.transformIndustry)
      .filter(industry => industry.slug !== null && industry.slug !== undefined);
    return limit ? result.slice(0, limit) : result;
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
    const modules = await getSanityModules();
    if (!modules) return null;
    const { sanityFetch, queries, transforms } = modules;
    const industry = await sanityFetch<any>(queries.industryBySlugQuery, {
      slug,
    });
    return (industry && !Array.isArray(industry)) ? transforms.transformIndustry(industry) : null;
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
    const modules = await getSanityModules();
    if (!modules) return [];
    const { sanityFetch, queries, transforms } = modules;
    const caseStudies = await sanityFetch<any[]>(queries.allCaseStudiesQuery);
    const result = caseStudies
      .filter(Boolean)
      .map(transforms.transformSingleWork)
      .filter((cs: any) => cs?.slug && cs?.data?.client);
    return limit ? result.slice(0, limit) : result;
  }

  const caseStudies = (await getCollection("caseStudies" as Parameters<typeof getCollection>[0])) as unknown as Array<{ id: string; data: SingleWork["data"]; render: () => unknown }>;
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
      render: () => render(caseStudy as unknown as Parameters<typeof render>[0]),
    }));
}

/**
 * Get a single work by slug
 */
export async function getSingleWorkBySlug(
  slug: string
): Promise<SingleWork | null> {
  if (USE_SANITY) {
    const modules = await getSanityModules();
    if (!modules) return null;
    const { sanityFetch, queries, transforms } = modules;
    const caseStudy = await sanityFetch<any>(queries.caseStudyBySlugQuery, {
      slug,
    });
    return (caseStudy && !Array.isArray(caseStudy)) ? transforms.transformSingleWork(caseStudy) : null;
  }

  const entry = (await getEntry("caseStudies" as Parameters<typeof getEntry>[0], slug)) as unknown as { id: string; data: SingleWork["data"]; render: () => unknown };
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
    render: () => render(entry as unknown as Parameters<typeof render>[0]),
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
    const modules = await getSanityModules();
    if (!modules) return [];
    const { sanityFetch, queries, transforms } = modules;
    const pages = await sanityFetch<any[]>(queries.allInfoPagesQuery);
    return pages.map(transforms.transformInfoPage);
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
    const modules = await getSanityModules();
    if (!modules) return null;
    const { sanityFetch, queries, transforms } = modules;
    const page = await sanityFetch<any>(queries.infoPageBySlugQuery, { slug });
    return (page && !Array.isArray(page)) ? transforms.transformInfoPage(page) : null;
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
