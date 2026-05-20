import { defineField, defineType } from "sanity";

export const industry = defineType({
  name: "industry",
  title: "Industry",
  type: "document",
  fields: [
    // =========== CORE METADATA ===========
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      description: "Brief one-sentence description (used in listings)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
      description: "Longer description for SEO and meta tags",
    }),

    // =========== SEO & SOCIAL ===========
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "seo",
      options: {
        collapsible: true,
        collapsed: true,
      },
    }),
    defineField({
      name: "og",
      title: "Open Graph (Social Media)",
      type: "object",
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: "title",
          title: "OG Title",
          type: "string",
        }),
        defineField({
          name: "description",
          title: "OG Description",
          type: "text",
          rows: 2,
        }),
        defineField({
          name: "type",
          title: "OG Type",
          type: "string",
          initialValue: "website",
        }),
      ],
    }),
    defineField({
      name: "twitter",
      title: "Twitter Card",
      type: "object",
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: "card",
          title: "Card Type",
          type: "string",
          initialValue: "summary_large_image",
        }),
        defineField({
          name: "title",
          title: "Twitter Title",
          type: "string",
        }),
        defineField({
          name: "description",
          title: "Twitter Description",
          type: "text",
          rows: 2,
        }),
      ],
    }),

    // =========== HERO SECTION ===========
    defineField({
      name: "hero",
      title: "1. Hero Section",
      type: "object",
      fields: [
        defineField({
          name: "breadcrumb",
          title: "Breadcrumb Text",
          type: "string",
          description: "e.g. 'Industries. Legal.'",
        }),
        defineField({
          name: "kicker",
          title: "Kicker (Small Label)",
          type: "string",
          description: "e.g. 'AI FOR LAW FIRMS'",
        }),
        defineField({
          name: "headline",
          title: "Main Headline",
          type: "string",
        }),
        defineField({
          name: "description",
          title: "Hero Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "backgroundColor",
          title: "Background Color",
          type: "string",
          description: "Hex color code (e.g. #005B65)",
        }),
        defineField({
          name: "image",
          title: "Hero Image",
          type: "object",
          fields: [
            defineField({
              name: "url",
              title: "Image URL",
              type: "string",
              description: "Image URL (from CDN or external source)",
            }),
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
            }),
          ],
        }),
      ],
    }),

    // =========== THREE TIER PROBLEMS ===========
    defineField({
      name: "threeTierProblems",
      title: "2. Three Tier Problems Section",
      type: "object",
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "The Three Problems Worth Solving",
        }),
        defineField({
          name: "description",
          title: "Section Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "tiers",
          title: "Problem Tiers",
          type: "array",
          of: [
            defineField({
              name: "tier",
              title: "Tier",
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Problem Title",
                  type: "string",
                }),
                defineField({
                  name: "benefit",
                  title: "Benefit Label",
                  type: "string",
                  description: "e.g. 'Revenue Impact'",
                }),
                defineField({
                  name: "description",
                  title: "Problem Description",
                  type: "text",
                  rows: 3,
                }),
                defineField({
                  name: "backgroundColor",
                  title: "Background Color",
                  type: "string",
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // =========== BENEFITS SECTION ===========
    defineField({
      name: "benefits",
      title: "3. Benefits & Delivery Section",
      type: "object",
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: "number",
          title: "Section Number",
          type: "number",
        }),
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
        }),
        defineField({
          name: "subtitle",
          title: "Subtitle",
          type: "string",
        }),
        defineField({
          name: "benefitItems",
          title: "Benefit Items",
          type: "array",
          of: [
            defineField({
              name: "benefitItem",
              title: "Benefit Item",
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Description",
                  type: "text",
                  rows: 2,
                }),
              ],
            }),
          ],
        }),
        defineField({
          name: "deliveryItems",
          title: "Delivery Items",
          type: "array",
          of: [
            defineField({
              name: "deliveryItem",
              title: "Delivery Item",
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Description",
                  type: "text",
                  rows: 2,
                }),
                defineField({
                  name: "backgroundColor",
                  title: "Background Color",
                  type: "string",
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // =========== VALUE PROPOSITION ===========
    defineField({
      name: "valueProposition",
      title: "4. Value Proposition Section",
      type: "object",
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
        }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "narrativeParagraphs",
          title: "Narrative Paragraphs",
          type: "array",
          of: [{ type: "text", rows: 3 }],
          description: "3-4 paragraphs explaining the value proposition",
        }),
      ],
    }),

    // =========== ROI SECTION ===========
    defineField({
      name: "roi",
      title: "5. ROI & Impact Section",
      type: "object",
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
        }),
        defineField({
          name: "beforeSection",
          title: "Before Implementation",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
            }),
            defineField({
              name: "stats",
              title: "Statistics",
              type: "array",
              of: [
                defineField({
                  name: "stat",
                  title: "Stat",
                  type: "object",
                  fields: [
                    defineField({
                      name: "label",
                      title: "Label",
                      type: "string",
                    }),
                    defineField({
                      name: "value",
                      title: "Value",
                      type: "string",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        defineField({
          name: "afterSection",
          title: "After Implementation",
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
            }),
            defineField({
              name: "stats",
              title: "Statistics",
              type: "array",
              of: [
                defineField({
                  name: "stat",
                  title: "Stat",
                  type: "object",
                  fields: [
                    defineField({
                      name: "label",
                      title: "Label",
                      type: "string",
                    }),
                    defineField({
                      name: "value",
                      title: "Value",
                      type: "string",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        defineField({
          name: "investment",
          title: "Total Investment",
          type: "string",
        }),
        defineField({
          name: "netBenefit",
          title: "Net Benefit",
          type: "string",
        }),
        defineField({
          name: "roiPercentage",
          title: "ROI Percentage",
          type: "string",
        }),
        defineField({
          name: "secondaryBenefits",
          title: "Secondary Benefits",
          type: "array",
          of: [
            defineField({
              name: "benefit",
              title: "Benefit",
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Description",
                  type: "text",
                  rows: 2,
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // =========== BLOG & FAQ ===========
    defineField({
      name: "blog",
      title: "6. Blog Section",
      type: "object",
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Latest Insights",
        }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 2,
        }),
        defineField({
          name: "category",
          title: "Blog Category",
          type: "string",
          description: "Category slug to pull related posts",
        }),
      ],
    }),
    defineField({
      name: "faqs",
      title: "7. FAQs Section",
      type: "object",
      options: {
        collapsible: true,
      },
      fields: [
        defineField({
          name: "slug",
          title: "FAQ Slug",
          type: "string",
          description: "Slug for the industry-specific FAQs",
        }),
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Frequently Asked Questions",
        }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 2,
        }),
      ],
    }),

    // =========== LEGACY FIELDS ===========
    defineField({
      name: "painPoints",
      title: "Pain Points (Legacy)",
      type: "array",
      of: [{ type: "string" }],
      hidden: true,
    }),
    defineField({
      name: "relevantServices",
      title: "Relevant Services (Legacy)",
      type: "array",
      of: [{ type: "string" }],
      hidden: true,
    }),
    defineField({
      name: "image",
      title: "Image (Legacy)",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
      hidden: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "hero.image",
    },
    prepare({ title, media }) {
      return {
        title,
        media,
      };
    },
  },
});
