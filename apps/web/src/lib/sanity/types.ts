import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import type { ImageMetadata } from "astro";

// =============================================================================
// IMAGE TYPES
// =============================================================================

export interface SanityImage {
  asset: SanityImageSource;
  alt?: string;
}

/**
 * Unified image type that works with both Content Collections and Sanity
 * - For Content Collections: url is ImageMetadata
 * - For Sanity: url is string (CDN URL)
 */
export interface UnifiedImage {
  url: ImageMetadata | string;
  alt: string;
}

// =============================================================================
// POST TYPES
// =============================================================================

/**
 * Post data as returned from Sanity queries
 */
export interface SanityPost {
  _id: string;
  title: string;
  slug: string;
  description: string;
  pubDate: string;
  tags: string[];
  team?: string; // Team member slug
  image: SanityImage;
  body: PortableTextBlock[] | string;
}

/**
 * Post shape expected by UI components (mirrors Astro content collection shape)
 */
export interface Post {
  slug: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    tags: string[];
    categories?: Array<{ id: number; name: string; slug: string }>;
    team?: string;
    image: UnifiedImage;
  };
  body?: string;
  markdown?: string;
  plainText?: string;
  render?: () => Promise<{ Content: unknown }>;
}

// =============================================================================
// TEAM MEMBER TYPES
// =============================================================================

export interface SanityTeamMember {
  _id: string;
  name: string;
  slug: string;
  role?: string;
  bio?: string;
  image: SanityImage;
  socials?: {
    twitter?: string;
    website?: string;
    linkedin?: string;
    email?: string;
  };
  body?: PortableTextBlock[];
}

/**
 * Team member shape expected by UI components
 */
export interface TeamMember {
  slug: string;
  data: {
    name: string;
    role?: string;
    bio?: string;
    image: UnifiedImage;
    socials?: {
      twitter?: string;
      website?: string;
      linkedin?: string;
      email?: string;
    };
  };
  body?: PortableTextBlock[];
  render?: () => Promise<{ Content: unknown }>;
}

// =============================================================================
// SERVICE TYPES
// =============================================================================

// Helper types for 10-section structure
export interface CTA {
  text?: string;
  url?: string;
}

export interface ProcessStep {
  stepNumber?: number;
  title?: string;
  description?: string;
  duration?: string;
}

export interface Deliverable {
  title?: string;
  description?: string;
}

export interface Framework {
  name?: string;
  description?: string;
  benefits?: string[];
}

export interface InlineCaseStudy {
  client?: string;
  industry?: string;
  challenge?: string;
  solution?: string;
  results?: Array<{
    metric?: string;
    value?: string;
  }>;
}

export interface FAQItem {
  question?: string;
  answer?: string;
}

export interface SanityService {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  category: "Advisory" | "Compliance" | "Operations";
  featured?: boolean;
  image?: SanityImage;
  pubDate?: string;
  updatedDate?: string;
  
  // 1. Hero Section
  hero?: {
    subtitle?: string;
    description?: string;
    primaryCta?: CTA;
    secondaryCta?: CTA;
  };

  // 2. Problem/Context
  problemContext?: {
    title?: string;
    description?: string;
    painPoints?: string[];
  };

  // 3. How It Works
  howItWorks?: {
    title?: string;
    description?: string;
    steps?: ProcessStep[];
    timelineTotal?: string;
  };

  // 4. What You Get
  whatYouGet?: {
    title?: string;
    description?: string;
    deliverables?: Deliverable[];
  };

  // 5. Framework Deep Dive
  frameworkDeepDive?: {
    title?: string;
    description?: string;
    frameworks?: Framework[];
  };

  // 6. Case Study
  caseStudy?: {
    title?: string;
    description?: string;
    featured?: string; // Reference ID to case study
    inline?: InlineCaseStudy;
  };

  // 7. Pricing & Investment
  pricingSection?: {
    title?: string;
    description?: string;
    pricingModel?: "one-time" | "monthly" | "hourly" | "custom";
    startingPrice?: string;
    monthlyPrice?: string;
    paymentTerms?: string;
    included?: string[];
    excluded?: string[];
  };

  // 8. Who This Is For
  whoThisFor?: {
    title?: string;
    description?: string;
    idealClient?: string;
    fitCriteria?: string[];
    poorFitCriteria?: string[];
    industries?: string[];
    companySize?: string;
    annualRevenue?: string;
  };

  // 9. FAQ
  faq?: {
    title?: string;
    description?: string;
    items?: FAQItem[];
  };

  // 10. Conversion
  conversion?: {
    title?: string;
    description?: string;
    primaryCta?: CTA;
    trustSignals?: string[];
    nextSteps?: string;
  };

  // Legacy fields for backward compatibility
  features?: string[];
  outcomes?: string[];
  industries?: string[];
  pricing?: {
    startingPrice?: string;
    monthlyPrice?: string;
    pricingModel?: "one-time" | "monthly" | "hourly" | "custom";
    note?: string;
  };

  body?: PortableTextBlock[];
}

/**
 * Service shape expected by UI components
 */
export interface Service {
  slug: string;
  data: {
    title: string;
    summary: string;
    category: "Advisory" | "Compliance" | "Operations";
    featured?: boolean;
    image?: UnifiedImage;
    pubDate?: Date;
    updatedDate?: Date;
    
    // 1. Hero Section
    hero?: {
      subtitle?: string;
      description?: string;
      primaryCta?: CTA;
      secondaryCta?: CTA;
    };

    // 2. Problem/Context
    problemContext?: {
      title?: string;
      description?: string;
      painPoints?: string[];
    };

    // 3. How It Works
    howItWorks?: {
      title?: string;
      description?: string;
      steps?: ProcessStep[];
      timelineTotal?: string;
    };

    // 4. What You Get
    whatYouGet?: {
      title?: string;
      description?: string;
      deliverables?: Deliverable[];
    };

    // 5. Framework Deep Dive
    frameworkDeepDive?: {
      title?: string;
      description?: string;
      frameworks?: Framework[];
    };

    // 6. Case Study
    caseStudy?: {
      title?: string;
      description?: string;
      featured?: string;
      inline?: InlineCaseStudy;
    };

    // 7. Pricing & Investment
    pricingSection?: {
      title?: string;
      description?: string;
      pricingModel?: "one-time" | "monthly" | "hourly" | "custom";
      startingPrice?: string;
      monthlyPrice?: string;
      paymentTerms?: string;
      included?: string[];
      excluded?: string[];
    };

    // 8. Who This Is For
    whoThisFor?: {
      title?: string;
      description?: string;
      idealClient?: string;
      fitCriteria?: string[];
      poorFitCriteria?: string[];
      industries?: string[];
      companySize?: string;
      annualRevenue?: string;
    };

    // 9. FAQ
    faq?: {
      title?: string;
      description?: string;
      items?: FAQItem[];
    };

    // 10. Conversion
    conversion?: {
      title?: string;
      description?: string;
      primaryCta?: CTA;
      trustSignals?: string[];
      nextSteps?: string;
    };

    // Legacy for backward compatibility
    features?: string[];
    outcomes?: string[];
    industries?: string[];
    pricing?: {
      startingPrice?: string;
      monthlyPrice?: string;
      pricingModel?: "one-time" | "monthly" | "hourly" | "custom";
      note?: string;
    };
  };
  body?: PortableTextBlock[];
  render?: () => Promise<{ Content: unknown }>;
}

// =============================================================================
// INDUSTRY TYPES
// =============================================================================

export interface SanityIndustry {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  seo?: any;
  og?: any;
  twitter?: any;
  hero?: {
    breadcrumb?: string;
    kicker?: string;
    headline?: string;
    description?: string;
    backgroundColor?: string;
    image?: {
      url?: string;
      alt?: string;
    };
  };
  threeTierProblems?: any;
  benefits?: any;
  valueProposition?: {
    title?: string;
    description?: string;
    narrativeParagraphs?: string[];
  };
  roi?: any;
  blog?: any;
  faqs?: any;
  painPoints?: string[];
  relevantServices?: string[];
  image?: SanityImage;
  body?: PortableTextBlock[];
}

/**
 * Industry shape expected by UI components
 */
export interface Industry {
  slug: string;
  data: {
    title: string;
    summary: string;
    description?: string;
    seo?: any;
    og?: any;
    twitter?: any;
    hero?: {
      breadcrumb?: string;
      kicker?: string;
      headline?: string;
      description?: string;
      backgroundColor?: string;
      image?: string | { url?: string; alt?: string };
    };
    threeTierProblems?: any;
    benefits?: any;
    valueProposition?: {
      title?: string;
      description?: string;
      narrativeParagraphs?: string[];
    };
    roi?: any;
    blog?: any;
    faqs?: any;
    painPoints: string[];
    relevantServices: string[];
    image?: UnifiedImage;
  };
  body?: PortableTextBlock[];
  render?: () => Promise<{ Content: unknown }>;
}

// =============================================================================
// CASE STUDY TYPES
// =============================================================================

export interface SanityResult {
  label: string;
  value: string;
}

export interface SanityTestimonial {
  quote: string;
  author: string;
  role?: string;
}

export interface SanitySingleWork {
  _id: string;
  slug: string;
  client: string;
  industry: string;
  services: string[];
  year?: number;
  tagline?: string;
  aboutClient?: string;
  ourProcess?: string;
  projectUrl?: string;
  results: SanityResult[];
  businessImpact?: string;
  testimonial?: SanityTestimonial;
  image?: SanityImage;
  projectImages?: SanityImage[];
  pubDate: string;
  body?: PortableTextBlock[];
}

/**
 * Single work/case study shape expected by UI components
 */
export interface SingleWork {
  slug: string;
  data: {
    client: string;
    industry: string;
    services: string[];
    year?: number;
    tagline?: string;
    aboutClient?: string;
    ourProcess?: string;
    projectUrl?: string;
    results: Array<{
      label: string;
      value: string;
    }>;
    businessImpact?: string;
    testimonial?: {
      quote: string;
      author: string;
      role?: string;
    };
    image?: UnifiedImage;
    projectImages?: UnifiedImage[];
    pubDate: Date;
  };
  body?: PortableTextBlock[];
  render?: () => Promise<{ Content: unknown }>;
}

// =============================================================================
// INFO PAGE TYPES (Legal/Privacy/Terms)
// =============================================================================

export interface SanityInfoPage {
  _id: string;
  page: string;
  slug: string;
  pubDate: string;
  body?: PortableTextBlock[];
}

/**
 * Info page shape expected by UI components
 */
export interface InfoPage {
  slug: string;
  data: {
    page: string;
    pubDate: Date;
  };
  body?: PortableTextBlock[];
  render?: () => Promise<{ Content: unknown }>;
}

// =============================================================================
// SITE SETTINGS TYPES
// =============================================================================

export interface SiteSettings {
  title?: string;
  description?: string;
  siteUrl?: string;
  ogImage?: SanityImage;
  twitterHandle?: string;
  navigation?: Array<{
    label: string;
    href: string;
  }>;
  footer?: {
    text?: string;
    links?: Array<{
      label: string;
      href: string;
    }>;
  };
  socials?: Array<{
    platform: string;
    url: string;
  }>;
}
