import { getImageUrl } from "./image";
import { portableTextToHtml } from "./portableText";
import type {
  SanityPost,
  SanityTeamMember,
  SanityService,
  SanityIndustry,
  SanitySingleWork,
  SanityInfoPage,
  Post,
  TeamMember,
  Service,
  Industry,
  SingleWork,
  InfoPage,
} from "./types";

/**
 * Transform Sanity post to UI-friendly shape
 * Matches the Astro content collection structure
 */
export function transformPost(post: SanityPost): Post {
  return {
    slug: post.slug,
    data: {
      title: post.title,
      description: post.description,
      pubDate: new Date(post.pubDate),
      tags: post.tags || [],
      category: post.category
        ? { id: post.category._id, name: post.category.title, slug: post.category.slug }
        : undefined,
      subcategory: post.subcategory
        ? { id: post.subcategory._id, name: post.subcategory.title, slug: post.subcategory.slug, parentId: post.subcategory.categoryId }
        : undefined,
      team: post.team,
      image: {
        url: getImageUrl(post.image?.asset),
        alt: post.image?.alt || post.title || "",
      },
    },
    body: Array.isArray(post.body) ? portableTextToHtml(post.body) : typeof post.body === "string" ? post.body : "",
  };
}

/**
 * Transform Sanity team member to UI-friendly shape
 */
export function transformTeamMember(member: SanityTeamMember): TeamMember {
  return {
    slug: member.slug,
    data: {
      name: member.name,
      role: member.role,
      bio: member.bio || "",
      image: {
        url: getImageUrl(member.image?.asset),
        alt: member.image?.alt || member.name || "",
      },
      socials: member.socials,
    },
    body: Array.isArray(member.body) ? portableTextToHtml(member.body) : member.body || "",
  };
}

/**
 * Transform Sanity service to UI-friendly shape
 * Includes all 10 service sections and legacy fields for backward compatibility
 */
export function transformService(service: SanityService): Service {
  return {
    slug: service.slug,
    data: {
      title: service.title,
      summary: service.summary,
      category: service.category,
      featured: service.featured,
      image: service.image
        ? {
            url: getImageUrl(service.image.asset),
            alt: service.image.alt || service.title || "",
          }
        : undefined,
      pubDate: service.pubDate ? new Date(service.pubDate) : undefined,
      updatedDate: service.updatedDate
        ? new Date(service.updatedDate)
        : undefined,

      // 1. Hero Section
      hero: service.hero
        ? {
            subtitle: service.hero.subtitle,
            description: service.hero.description,
            primaryCta: service.hero.primaryCta,
            secondaryCta: service.hero.secondaryCta,
          }
        : undefined,

      // 2. Problem/Context
      problemContext: service.problemContext
        ? {
            title: service.problemContext.title,
            description: service.problemContext.description,
            painPoints: service.problemContext.painPoints || [],
          }
        : undefined,

      // 3. How It Works
      howItWorks: service.howItWorks
        ? {
            title: service.howItWorks.title,
            description: service.howItWorks.description,
            steps: service.howItWorks.steps || [],
            timelineTotal: service.howItWorks.timelineTotal,
          }
        : undefined,

      // 4. What You Get
      whatYouGet: service.whatYouGet
        ? {
            title: service.whatYouGet.title,
            description: service.whatYouGet.description,
            deliverables: service.whatYouGet.deliverables || [],
          }
        : undefined,

      // 5. Framework Deep Dive
      frameworkDeepDive: service.frameworkDeepDive
        ? {
            title: service.frameworkDeepDive.title,
            description: service.frameworkDeepDive.description,
            frameworks: service.frameworkDeepDive.frameworks || [],
          }
        : undefined,

      // 6. Case Study
      caseStudy: service.caseStudy
        ? {
            title: service.caseStudy.title,
            description: service.caseStudy.description,
            featured: service.caseStudy.featured?._id,
            inline: service.caseStudy.inline,
          }
        : undefined,

      // 7. Pricing & Investment
      pricingSection: service.pricingSection
        ? {
            title: service.pricingSection.title,
            description: service.pricingSection.description,
            pricingModel: service.pricingSection.pricingModel,
            startingPrice: service.pricingSection.startingPrice,
            monthlyPrice: service.pricingSection.monthlyPrice,
            paymentTerms: service.pricingSection.paymentTerms,
            included: service.pricingSection.included || [],
            excluded: service.pricingSection.excluded || [],
          }
        : undefined,

      // 8. Who This Is For
      whoThisFor: service.whoThisFor
        ? {
            title: service.whoThisFor.title,
            description: service.whoThisFor.description,
            idealClient: service.whoThisFor.idealClient,
            fitCriteria: service.whoThisFor.fitCriteria || [],
            poorFitCriteria: service.whoThisFor.poorFitCriteria || [],
            industries: service.whoThisFor.industries || [],
            companySize: service.whoThisFor.companySize,
            annualRevenue: service.whoThisFor.annualRevenue,
          }
        : undefined,

      // 9. FAQ
      faq: service.faq
        ? {
            title: service.faq.title,
            description: service.faq.description,
            items: service.faq.items || [],
          }
        : undefined,

      // 10. Conversion
      conversion: service.conversion
        ? {
            title: service.conversion.title,
            description: service.conversion.description,
            primaryCta: service.conversion.primaryCta,
            trustSignals: service.conversion.trustSignals || [],
            nextSteps: service.conversion.nextSteps,
          }
        : undefined,

      // Legacy fields for backward compatibility
      features: service.features || [],
      outcomes: service.outcomes || [],
      industries: service.industries || [],
      pricing: service.pricing,
    },
    body: Array.isArray(service.body) ? portableTextToHtml(service.body) : service.body || "",
  };
}

/**
 * Transform Sanity industry to UI-friendly shape
 */
export function transformIndustry(industry: SanityIndustry): Industry {
  return {
    slug: industry.slug,
    data: {
      title: industry.title,
      summary: industry.summary,
      description: industry.description,
      seo: industry.seo,
      og: industry.og,
      twitter: industry.twitter,
      hero: industry.hero
        ? {
            breadcrumb: industry.hero.breadcrumb,
            kicker: industry.hero.kicker,
            headline: industry.hero.headline,
            description: industry.hero.description,
            backgroundColor: industry.hero.backgroundColor,
            image: industry.hero.image?.url || undefined,
          }
        : undefined,
      threeTierProblems: industry.threeTierProblems,
      benefits: industry.benefits,
      valueProposition: industry.valueProposition,
      roi: industry.roi,
      blog: industry.blog,
      faqs: industry.faqs,
      painPoints: industry.painPoints || [],
      relevantServices: industry.relevantServices || [],
      image: industry.image
        ? {
            url: getImageUrl(industry.image.asset),
            alt: industry.image.alt || industry.title || "",
          }
        : undefined,
    },
    body: Array.isArray(industry.body) ? portableTextToHtml(industry.body) : industry.body || "",
  };
}

/**
 * Transform Sanity single work to UI-friendly shape
 */
export function transformSingleWork(singleWork: SanitySingleWork): SingleWork {
  return {
    slug: singleWork.slug,
    data: {
      client: singleWork.client,
      industry: singleWork.industry,
      imcServices: singleWork.imcServices || [],
      aiStudioServices: singleWork.aiStudioServices || [],
      services: [...(singleWork.imcServices || []), ...(singleWork.aiStudioServices || [])],
      completionDate: singleWork.completionDate,
      year: singleWork.completionDate ? new Date(singleWork.completionDate).getFullYear() : undefined,
      displayOrder: singleWork.displayOrder,
      tagline: singleWork.tagline,
      aboutClient: singleWork.aboutClient,
      ourProcess: singleWork.ourProcess,
      projectUrl: singleWork.projectUrl,
      results: singleWork.results || [],
      businessImpact: singleWork.businessImpact,
      testimonial: singleWork.testimonial,
      image: singleWork.image
        ? {
            url: getImageUrl(singleWork.image.asset),
            alt: singleWork.image.alt || singleWork.client || "",
          }
        : undefined,
      projectImages: singleWork.projectImages
        ? singleWork.projectImages.map((img) => ({
            url: getImageUrl(img.asset),
            alt: img.alt || "",
          }))
        : undefined,
      pubDate: new Date(singleWork.pubDate),
    },
    body: Array.isArray(singleWork.body) ? portableTextToHtml(singleWork.body) : singleWork.body || "",
  };
}

/**
 * Transform Sanity info page to UI-friendly shape
 */
export function transformInfoPage(page: SanityInfoPage): InfoPage {
  return {
    slug: page.slug,
    data: {
      page: page.page,
      pubDate: new Date(page.pubDate),
    },
    body: Array.isArray(page.body) ? portableTextToHtml(page.body) : page.body || "",
  };
}
