import groq from "groq";

// =============================================================================
// POSTS
// =============================================================================

// Shared post fields projection
const postFields = groq`
  _id,
  title,
  "slug": slug.current,
  description,
  pubDate,
  tags,
  "category": category->{
    "_id": _id,
    title,
    "slug": slug.current
  },
  "subcategory": subcategory->{
    "_id": _id,
    title,
    "slug": slug.current,
    "categoryId": category->._id
  },
  "team": team->slug.current,
  image {
    asset->,
    alt
  }
`;

// All posts (for listing)
export const allPostsQuery = groq`
  *[_type == "post"] | order(pubDate desc) {
    ${postFields},
    "body": pt::text(body)
  }
`;

// Single post by slug
export const postBySlugQuery = groq`
  *[_type == "post" && slug.current == $slug][0] {
    ${postFields},
    body
  }
`;

// Posts by tag
export const postsByTagQuery = groq`
  *[_type == "post" && $tag in tags] | order(pubDate desc) {
    ${postFields},
    "body": pt::text(body)
  }
`;

// All unique tags
export const allTagsQuery = groq`
  array::unique(*[_type == "post" && defined(tags)].tags[])
`;

// Related posts (by tags, excluding current)
export const relatedPostsQuery = groq`
  *[_type == "post" && slug.current != $slug && count((tags)[@ in $tags]) > 0] | order(pubDate desc) [0...3] {
    ${postFields},
    "body": pt::text(body)
  }
`;

// Posts by category slug
export const postsByCategorySlugQuery = groq`
  *[_type == "post" && category->slug.current == $categorySlug] | order(pubDate desc) {
    ${postFields},
    "body": pt::text(body)
  }
`;

// Posts by subcategory slug
export const postsBySubcategorySlugQuery = groq`
  *[_type == "post" && subcategory->slug.current == $subcategorySlug] | order(pubDate desc) {
    ${postFields},
    "body": pt::text(body)
  }
`;

// =============================================================================
// TEAM MEMBERS
// =============================================================================

const teamMemberFields = groq`
  _id,
  name,
  "slug": slug.current,
  role,
  bio,
  image {
    asset->,
    alt
  },
  socials {
    twitter,
    website,
    linkedin,
    email
  }
`;

// All team members
export const allTeamMembersQuery = groq`
  *[_type == "teamMember"] | order(name asc) {
    ${teamMemberFields}
  }
`;

// Single team member by slug
export const teamMemberBySlugQuery = groq`
  *[_type == "teamMember" && slug.current == $slug][0] {
    ${teamMemberFields},
    body
  }
`;

// =============================================================================
// SERVICES
// =============================================================================

const serviceFields = groq`
  _id,
  title,
  "slug": slug.current,
  summary,
  category,
  featured,
  image {
    asset->,
    alt
  },
  pubDate,
  updatedDate,
  
  hero {
    subtitle,
    description,
    primaryCta {
      text,
      url
    },
    secondaryCta {
      text,
      url
    }
  },
  
  problemContext {
    title,
    description,
    painPoints
  },
  
  howItWorks {
    title,
    description,
    steps[] {
      stepNumber,
      title,
      description,
      duration
    },
    timelineTotal
  },
  
  whatYouGet {
    title,
    description,
    deliverables[] {
      title,
      description
    }
  },
  
  frameworkDeepDive {
    title,
    description,
    frameworks[] {
      name,
      description,
      benefits
    }
  },
  
  caseStudy {
    title,
    description,
    featured->{
      _id,
      title,
      "slug": slug.current,
      client,
      industry,
      services,
      challenge,
      solution,
      results[] {
        metric,
        value
      }
    },
    inline {
      client,
      industry,
      challenge,
      solution,
      results[] {
        metric,
        value
      }
    }
  },
  
  pricingSection {
    title,
    description,
    pricingModel,
    startingPrice,
    monthlyPrice,
    paymentTerms,
    included,
    excluded
  },
  
  whoThisFor {
    title,
    description,
    idealClient,
    fitCriteria,
    poorFitCriteria,
    industries,
    companySize,
    annualRevenue
  },
  
  faq {
    title,
    description,
    items[] {
      question,
      answer
    }
  },
  
  conversion {
    title,
    description,
    primaryCta {
      text,
      url
    },
    trustSignals,
    nextSteps
  },
  
  features,
  outcomes,
  industries,
  pricing {
    startingPrice,
    monthlyPrice,
    pricingModel,
    note
  }
`;

// All services
export const allServicesQuery = groq`
  *[_type == "service"] | order(title asc) {
    ${serviceFields}
  }
`;

// Single service by slug (includes body)
export const serviceBySlugQuery = groq`
  *[_type == "service" && slug.current == $slug][0] {
    ${serviceFields},
    body
  }
`;

// Services by category
export const servicesByCategoryQuery = groq`
  *[_type == "service" && category == $category] | order(title asc) {
    ${serviceFields}
  }
`;

// Featured services only
export const featuredServicesQuery = groq`
  *[_type == "service" && featured == true] | order(title asc) {
    ${serviceFields}
  }
`;

// =============================================================================
// INDUSTRIES
// =============================================================================

const industryFields = groq`
  _id,
  title,
  "slug": slug.current,
  summary,
  description,
  seo,
  og,
  twitter,
  hero {
    breadcrumb,
    kicker,
    headline,
    description,
    backgroundColor,
    image {
      url,
      alt
    }
  },
  threeTierProblems {
    title,
    description,
    tiers[] {
      title,
      benefit,
      description,
      backgroundColor
    }
  },
  benefits {
    number,
    title,
    subtitle,
    benefitItems[] {
      title,
      description
    },
    deliveryItems[] {
      title,
      description,
      backgroundColor
    }
  },
  valueProposition {
    title,
    description,
    narrativeParagraphs[]
  },
  roi {
    title,
    beforeSection {
      title,
      stats[] {
        label,
        value
      }
    },
    afterSection {
      title,
      stats[] {
        label,
        value
      }
    },
    investment,
    netBenefit,
    roiPercentage,
    secondaryBenefits[] {
      title,
      description
    }
  },
  blog {
    title,
    description,
    category
  },
  faqs {
    slug,
    title,
    description
  },
  painPoints,
  relevantServices,
  image {
    asset->,
    alt
  }
`;

// All industries
export const allIndustriesQuery = groq`
  *[_type == "industry"] | order(title asc) {
    ${industryFields}
  }
`;

// Single industry by slug
export const industryBySlugQuery = groq`
  *[_type == "industry" && slug.current == $slug][0] {
    ${industryFields},
    body
  }
`;

// =============================================================================
// CASE STUDIES
// =============================================================================

const caseStudyFields = groq`
  _id,
  "slug": slug.current,
  client,
  industry,
  imcServices,
  aiStudioServices,
  completionDate,
  displayOrder,
  tagline,
  aboutClient,
  ourProcess,
  projectUrl,
  results[] {
    label,
    value
  },
  businessImpact,
  testimonial {
    quote,
    author,
    role
  },
  image {
    asset->,
    alt
  },
  projectImages[] {
    asset->,
    alt
  },
  pubDate
`;

// All case studies
export const allCaseStudiesQuery = groq`
  *[_type == "singleWork"] | order(completionDate desc) {
    ${caseStudyFields}
  }
`;

// Single case study by slug
export const caseStudyBySlugQuery = groq`
  *[_type == "singleWork" && slug.current == $slug][0] {
    ${caseStudyFields},
    body
  }
`;

// =============================================================================
// INFO PAGES (Legal/Privacy/Terms)
// =============================================================================

const infoPageFields = groq`
  _id,
  page,
  "slug": slug.current,
  pubDate
`;

// All info pages
export const allInfoPagesQuery = groq`
  *[_type == "infoPage"] {
    ${infoPageFields}
  }
`;

// Single info page by slug
export const infoPageBySlugQuery = groq`
  *[_type == "infoPage" && slug.current == $slug][0] {
    ${infoPageFields},
    body
  }
`;

// =============================================================================
// CATEGORIES & SUBCATEGORIES
// =============================================================================

export const allCategoriesQuery = groq`
  *[_type == "category"] | order(title asc) {
    "_id": _id,
    title,
    "slug": slug.current,
    description
  }
`;

export const allSubcategoriesQuery = groq`
  *[_type == "subcategory"] | order(title asc) {
    "_id": _id,
    title,
    "slug": slug.current,
    description,
    "parentId": category->._id,
    "parentSlug": category->slug.current
  }
`;

// =============================================================================
// SITE SETTINGS
// =============================================================================

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    siteUrl,
    ogImage {
      asset->,
      alt
    },
    twitterHandle,
    navigation[] {
      label,
      href
    },
    footer {
      text,
      links[] {
        label,
        href
      }
    },
    socials[] {
      platform,
      url
    }
  }
`;
