import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const team = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/team" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string().optional(),
      bio: z.string().optional(),
      image: z.object({
        url: image(),
        alt: z.string(),
      }),
      socials: z
        .object({
          twitter: z.string().optional(),
          website: z.string().optional(),
          linkedin: z.string().optional(),
          email: z.string().optional(),
        })
        .optional(),
    }),
});

const postsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string(),
      team: z.string(),
      image: z.object({
        url: image(),
        alt: z.string(),
      }),
      tags: z.array(z.string()),
    }),
});

const infopages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/infopages" }),
  schema: z.object({
    page: z.string(),
    pubDate: z.date(),
  }),
});

const industries = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/industries" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      description: z.string().optional(),
      slug: z.string().optional(),
      painPoints: z.array(z.string()).default([]),
      relevantServices: z.array(z.string()).default([]),
      image: z
        .object({
          url: image(),
          alt: z.string(),
        })
        .optional(),
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          canonical: z.string().optional(),
          keywords: z.array(z.string()).default([]),
        })
        .optional(),
      og: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          type: z.string().optional(),
        })
        .optional(),
      twitter: z
        .object({
          card: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
      hero: z
        .object({
          breadcrumb: z.string().optional(),
          kicker: z.string().optional(),
          headline: z.string().optional(),
          description: z.string().optional(),
          backgroundColor: z.string().optional(),
          image: z.string().optional(),
        })
        .optional(),
      threeTierProblems: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          tiers: z
            .array(
              z.object({
                title: z.string().optional(),
                benefit: z.string().optional(),
                description: z.string().optional(),
                backgroundColor: z.string().optional(),
              }),
            )
            .default([]),
        })
        .optional(),
      benefits: z
        .object({
          number: z.number().optional(),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          benefitItems: z
            .array(
              z.object({
                title: z.string().optional(),
                description: z.string().optional(),
                backgroundColor: z.string().optional(),
              }),
            )
            .default([]),
          deliveryItems: z
            .array(
              z.object({
                title: z.string().optional(),
                description: z.string().optional(),
                backgroundColor: z.string().optional(),
              }),
            )
            .default([]),
        })
        .optional(),
      valueProposition: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          narrativeParagraphs: z.array(z.string()).default([]),
        })
        .optional(),
      roi: z
        .object({
          title: z.string().optional(),
          beforeSection: z
            .object({
              title: z.string().optional(),
              stats: z
                .array(
                  z.object({
                    label: z.string().optional(),
                    value: z.string().optional(),
                  }),
                )
                .default([]),
            })
            .optional(),
          afterSection: z
            .object({
              title: z.string().optional(),
              stats: z
                .array(
                  z.object({
                    label: z.string().optional(),
                    value: z.string().optional(),
                  }),
                )
                .default([]),
            })
            .optional(),
          investment: z.string().optional(),
          netBenefit: z.string().optional(),
          roiPercentage: z.string().optional(),
          secondaryBenefits: z
            .array(
              z.object({
                title: z.string().optional(),
                description: z.string().optional(),
              }),
            )
            .default([]),
        })
        .optional(),
      blog: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
        })
        .optional(),
      faqs: z
        .object({
          slug: z.string().optional(),
          title: z.string().optional(),
          description: z.string().optional(),
        })
        .optional(),
    }),
});

const faqs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/faqs" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    seo: z
      .object({
        keywords: z.array(z.string()),
      })
      .optional(),
    faqs: z.array(
      z.object({
        id: z.string(),
        question: z.string(),
        shortTitle: z.string(),
        shortAnswer: z.string(),
        fullAnswer: z.string(),
      }),
    ),
  }),
});

const capabilities = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/capabilities" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    pageTitle: z.string().optional(),
    seoMetaDescription: z.string().optional(),
    schema: z
      .object({
        type: z.string().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      })
      .optional(),

    // Card image for index listing
    cardImage: z.string().optional(),

    // Hero section
    hero: z
      .object({
        subtitle: z.string().optional(),
        description: z.string().optional(),
      })
      .optional(),

    // Barriers/Failure Points
    barriers: z
      .array(
        z.object({
          title: z.string(),
          bullets: z.array(z.string()),
        }),
      )
      .default([]),

    // Barrier section customization
    barrierSection: z
      .object({
        title: z.string().optional(),
        heading: z.string().optional(),
        description: z.string().optional(),
      })
      .optional(),

    // Programs/Barrier Combat
    programs: z
      .array(
        z.object({
          title: z.string(),
          subtitle: z.string(),
          combats: z.string(),
          for: z.string(),
        }),
      )
      .default([]),

    // Highlights/Quick wins
    highlights: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
        }),
      )
      .default([]),

    // Value Steps/What You Get
    valueSteps: z
      .array(
        z.object({
          phase: z.string(),
          title: z.string(),
          description: z.string(),
          bullets: z.array(z.string()),
        }),
      )
      .default([]),

    // Vertical Carousels/Detailed Sections
    carouselSections: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          items: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              image: z.string().optional(),
            }),
          ),
        }),
      )
      .default([]),

    // FAQs
    faqs: z
      .array(
        z.object({
          category: z.string(),
          questions: z.array(
            z.object({
              question: z.string(),
              answer: z.string(),
            }),
          ),
        }),
      )
      .default([]),

    seo: z
      .object({
        keywords: z.array(z.string()),
      })
      .optional(),

    seoType: z.string().optional(),
  }),
});

export const collections = {
  team,
  infopages,
  posts: postsCollection,
  industries,
  faqs,
  capabilities,
};
