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
export const USE_WORDPRESS = false;

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
// POSTS
// =============================================================================

/**
 * Get all posts - uses cached posts for instant loading
 * Posts are cached at build time, ensuring fast native-like performance
 * New posts require a rebuild/redeploy to appear
 */
export async function getPosts() {
  if (!USE_WORDPRESS) {
    return [];
  }

  try {
    const { readCachedPosts } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");

    const cachedPosts = await readCachedPosts();
    if (cachedPosts && cachedPosts.length > 0) {
      return cachedPosts.map(transformWordPressPost);
    }

    // If no cache exists at all, try fetching fresh (first build)
    const { fetchWordPressPosts } = await import("./wordpress/fetch");
    const posts = await fetchWordPressPosts();
    return posts.map(transformWordPressPost);
  } catch (error) {
    console.warn(
      "Failed to load posts. Ensure cache-wordpress-posts.ts has been run.",
      error
    );
    return [];
  }
}

/**
 * Get a single post by slug from cached posts
 * Uses pre-cached posts for instant access, requires rebuild to show new posts
 */
export async function getPostBySlug(slug: string) {
  if (!USE_WORDPRESS) {
    return null;
  }

  try {
    const { readCachedPosts } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");

    const cachedPosts = await readCachedPosts();
    if (cachedPosts) {
      const post = cachedPosts.find((p) => p.slug === slug);
      if (post) {
        return transformWordPressPost(post);
      }
    }

    // If not in cache, try fetching fresh (shouldn't happen in normal operation)
    console.warn(`Post "${slug}" not found in cache`);
  } catch (error) {
    console.warn(`Failed to get post "${slug}":`, error);
  }

  return null;
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string): Promise<Post[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const posts = await sanityFetch<any[]>(queries.postsByTagQuery, { tag });
    return posts.map(transforms.transformPost);
  }

  const posts = await getCollection("posts", ({ data }) =>
    data.tags.includes(tag)
  );
  return posts.map((post) => ({
    slug: post.id,
    data: {
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      tags: post.data.tags,
      team: post.data.team,
      image: post.data.image,
    },
    render: () => render(post),
  }));
}

/**
 * Get posts by category slug — Sanity or WordPress
 */
export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const posts = await sanityFetch<any[]>(queries.postsByCategorySlugQuery, { categorySlug });
    return posts.map(transforms.transformPost);
  }

  if (!USE_WORDPRESS) {
    return [];
  }

  try {
    const { readCachedPosts } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");

    const cachedPosts = await readCachedPosts();
    if (cachedPosts && cachedPosts.length > 0) {
      const filteredPosts = cachedPosts.filter((post) =>
        post._embedded?.["wp:term"]?.some?.((termArray: any[]) =>
          termArray.some(
            (term: any) =>
              term.taxonomy === "category" &&
              term.parent === 0 &&
              term.slug === categorySlug
          )
        )
      );
      return filteredPosts.map(transformWordPressPost);
    }

    return [];
  } catch (error) {
    console.warn(`Failed to fetch posts from category "${categorySlug}":`, error);
    return [];
  }
}

/**
 * Get posts by subcategory slug — Sanity or WordPress
 */
export async function getPostsBySubcategory(subcategorySlug: string): Promise<Post[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const posts = await sanityFetch<any[]>(queries.postsBySubcategorySlugQuery, { subcategorySlug });
    return posts.map(transforms.transformPost);
  }

  if (!USE_WORDPRESS) {
    return [];
  }

  try {
    const { readCachedPosts } = await import("./wordpress/cache");
    const { transformWordPressPost } = await import("./wordpress/transforms");

    const cachedPosts = await readCachedPosts();
    if (cachedPosts && cachedPosts.length > 0) {
      const filteredPosts = cachedPosts.filter((post) =>
        post._embedded?.["wp:term"]?.some?.((termArray: any[]) =>
          termArray.some(
            (term: any) =>
              term.taxonomy === "category" &&
              term.parent > 0 &&
              term.slug === subcategorySlug
          )
        )
      );
      return filteredPosts.map(transformWordPressPost);
    }

    return [];
  } catch (error) {
    console.warn(`Failed to fetch posts from subcategory "${subcategorySlug}":`, error);
    return [];
  }
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries } = await getSanityModules();
    return sanityFetch<string[]>(queries.allTagsQuery);
  }

  const posts = await getCollection("posts");
  const tags = new Set<string>();
  posts.forEach((p) => p.data.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags);
}

/**
 * Get all categories — Sanity or WordPress
 */
export async function getAllCategories(): Promise<Category[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries } = await getSanityModules();
    const raw = await sanityFetch<any[]>(queries.allCategoriesQuery);
    return raw.map((c) => ({ id: c._id, name: c.title, slug: c.slug, description: c.description }));
  }

  if (!USE_WORDPRESS) {
    return [];
  }

  try {
    const posts = await getPosts();
    const categoryMap = new Map<string, Category>();

    posts.forEach((post) => {
      post.data.categories?.forEach((cat) => {
        if (!categoryMap.has(cat.slug)) {
          categoryMap.set(cat.slug, { id: cat.id, name: cat.name, slug: cat.slug });
        }
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.warn("Failed to get categories:", error);
    return [];
  }
}

/**
 * Get all subcategories — Sanity or WordPress
 */
export async function getAllSubcategories(): Promise<Subcategory[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries } = await getSanityModules();
    const raw = await sanityFetch<any[]>(queries.allSubcategoriesQuery);
    return raw.map((s) => ({
      id: s._id,
      name: s.title,
      slug: s.slug,
      description: s.description,
      parentId: s.parentId,
      parentSlug: s.parentSlug,
    }));
  }

  if (!USE_WORDPRESS) {
    return [];
  }

  try {
    const posts = await getPosts();
    const subcategoryMap = new Map<string, Subcategory>();

    posts.forEach((post) => {
      post.data.subcategories?.forEach((sub) => {
        if (!subcategoryMap.has(sub.slug)) {
          subcategoryMap.set(sub.slug, {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            parentId: sub.parentId,
          });
        }
      });
    });

    return Array.from(subcategoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
export async function getTeamMembers(): Promise<TeamMember[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const members = await sanityFetch<any[]>(queries.allTeamMembersQuery);
    return members.map(transforms.transformTeamMember);
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
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const member = await sanityFetch<any>(queries.teamMemberBySlugQuery, {
      slug,
    });
    return member ? transforms.transformTeamMember(member) : null;
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
export async function getServices(): Promise<Service[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const services = await sanityFetch<any[]>(queries.allServicesQuery);
    return services.filter(Boolean).map(transforms.transformService).filter((s: any) => s?.slug);
  }

  const services = await getCollection("services");
  return services
    .filter((service: any) => service?.data?.title)
    .map((service) => ({
      slug: service.id,
      data: {
        title: service.data.title,
        summary: service.data.summary,
        category: service.data.category,
        features: service.data.features,
        outcomes: service.data.outcomes,
        industries: service.data.industries,
        pricing: service.data.pricing,
        image: service.data.image,
        pubDate: service.data.pubDate,
        updatedDate: service.data.updatedDate,
      },
      render: () => render(service),
    }));
}

/**
 * Get a single service by slug
 */
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const service = await sanityFetch<any>(queries.serviceBySlugQuery, {
      slug,
    });
    return service ? transforms.transformService(service) : null;
  }

  const entry = await getEntry("services", slug);
  if (!entry) return null;
  return {
    slug: entry.id,
    data: {
      title: entry.data.title,
      summary: entry.data.summary,
      category: entry.data.category,
      features: entry.data.features,
      outcomes: entry.data.outcomes,
      industries: entry.data.industries,
      pricing: entry.data.pricing,
      image: entry.data.image,
      pubDate: entry.data.pubDate,
      updatedDate: entry.data.updatedDate,
    },
    render: () => render(entry),
  };
}

// =============================================================================
// INDUSTRIES
// =============================================================================

/**
 * Get all industries
 */
export async function getIndustries(): Promise<Industry[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const industries = await sanityFetch<any[]>(queries.allIndustriesQuery);
    return industries
      .map(transforms.transformIndustry)
      .filter(industry => industry.slug !== null && industry.slug !== undefined);
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
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const industry = await sanityFetch<any>(queries.industryBySlugQuery, {
      slug,
    });
    return industry ? transforms.transformIndustry(industry) : null;
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
export async function getOurWork(): Promise<SingleWork[]> {
  if (USE_SANITY) {
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const caseStudies = await sanityFetch<any[]>(queries.allCaseStudiesQuery);
    return caseStudies
      .filter(Boolean)
      .map(transforms.transformSingleWork)
      .filter((cs: any) => cs?.slug && cs?.data?.client);
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
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const caseStudy = await sanityFetch<any>(queries.caseStudyBySlugQuery, {
      slug,
    });
    return caseStudy ? transforms.transformSingleWork(caseStudy) : null;
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
    const { sanityFetch, queries, transforms } = await getSanityModules();
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
    const { sanityFetch, queries, transforms } = await getSanityModules();
    const page = await sanityFetch<any>(queries.infoPageBySlugQuery, { slug });
    return page ? transforms.transformInfoPage(page) : null;
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
