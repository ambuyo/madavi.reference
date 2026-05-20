import { defineField, defineType } from "sanity";

export const service = defineType({
  name: "service",
  title: "Service",
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
      description: "Brief description of the service (used in listings)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Advisory", value: "Advisory" },
          { title: "Compliance", value: "Compliance" },
          { title: "Operations", value: "Operations" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "featured",
      title: "Featured Service",
      type: "boolean",
      description: "Highlight this service on homepage/listings",
    }),
    defineField({
      name: "image",
      title: "Featured Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Describe the image for accessibility",
        }),
      ],
    }),
    defineField({
      name: "pubDate",
      title: "Publish Date",
      type: "datetime",
    }),
    defineField({
      name: "updatedDate",
      title: "Updated Date",
      type: "datetime",
    }),

    // =========== SECTION 1: HERO ===========
    defineField({
      name: "hero",
      title: "1. Hero Section",
      type: "object",
      description: "Above-the-fold hero section with value proposition",
      fields: [
        defineField({
          name: "subtitle",
          title: "Subtitle",
          type: "string",
          description: "Tagline or category (e.g., 'Strategic Advisory')",
        }),
        defineField({
          name: "description",
          title: "Hero Description",
          type: "text",
          rows: 4,
          description: "Compelling narrative of what this service does",
        }),
        defineField({
          name: "primaryCta",
          title: "Primary CTA",
          type: "object",
          fields: [
            defineField({
              name: "text",
              title: "Button Text",
              type: "string",
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
            }),
          ],
        }),
        defineField({
          name: "secondaryCta",
          title: "Secondary CTA (Optional)",
          type: "object",
          fields: [
            defineField({
              name: "text",
              title: "Button Text",
              type: "string",
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
            }),
          ],
        }),
      ],
    }),

    // =========== SECTION 2: PROBLEM/CONTEXT ===========
    defineField({
      name: "problemContext",
      title: "2. Problem / Context Section",
      type: "object",
      description: "Why this service exists and what gap it fills",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "The Challenge",
        }),
        defineField({
          name: "description",
          title: "Problem Description",
          type: "text",
          rows: 5,
          description: "Articulate the problem your service solves",
        }),
        defineField({
          name: "painPoints",
          title: "Key Pain Points",
          type: "array",
          of: [{ type: "string" }],
          description: "List of specific problems clients face",
        }),
      ],
    }),

    // =========== SECTION 3: HOW IT WORKS ===========
    defineField({
      name: "howItWorks",
      title: "3. How It Works Section",
      type: "object",
      description: "Methodology, process, and timeline",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Our Process",
        }),
        defineField({
          name: "description",
          title: "Intro Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "steps",
          title: "Process Steps",
          type: "array",
          of: [
            defineField({
              type: "object",
              fields: [
                defineField({
                  name: "stepNumber",
                  title: "Step Number",
                  type: "number",
                }),
                defineField({
                  name: "title",
                  title: "Step Title",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "Step Description",
                  type: "text",
                  rows: 3,
                }),
                defineField({
                  name: "duration",
                  title: "Duration (Optional)",
                  type: "string",
                  description: "e.g., '2-3 weeks'",
                }),
              ],
            }),
          ],
        }),
        defineField({
          name: "timelineTotal",
          title: "Total Timeline",
          type: "string",
          description: "Overall project duration",
        }),
      ],
    }),

    // =========== SECTION 4: WHAT YOU GET ===========
    defineField({
      name: "whatYouGet",
      title: "4. What You Get Section",
      type: "object",
      description: "Deliverables, outcomes, and specifics",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "What You'll Receive",
        }),
        defineField({
          name: "description",
          title: "Intro Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "deliverables",
          title: "Key Deliverables",
          type: "array",
          of: [
            defineField({
              type: "object",
              fields: [
                defineField({
                  name: "title",
                  title: "Deliverable Title",
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

    // =========== SECTION 5: FRAMEWORK DEEP DIVE ===========
    defineField({
      name: "frameworkDeepDive",
      title: "5. Framework Deep Dive Section",
      type: "object",
      description: "Consulting frameworks and their application",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Our Frameworks & Approach",
        }),
        defineField({
          name: "description",
          title: "Intro Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "frameworks",
          title: "Frameworks Used",
          type: "array",
          of: [
            defineField({
              type: "object",
              fields: [
                defineField({
                  name: "name",
                  title: "Framework Name",
                  type: "string",
                }),
                defineField({
                  name: "description",
                  title: "How It's Applied",
                  type: "text",
                  rows: 3,
                }),
                defineField({
                  name: "benefits",
                  title: "Key Benefits",
                  type: "array",
                  of: [{ type: "string" }],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // =========== SECTION 6: CASE STUDY ===========
    defineField({
      name: "caseStudy",
      title: "6. Case Study Section",
      type: "object",
      description: "Real example with metrics and results",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "See It In Action",
        }),
        defineField({
          name: "description",
          title: "Intro Description",
          type: "text",
          rows: 2,
        }),
        defineField({
          name: "featured",
          title: "Featured Case Study",
          type: "reference",
          to: [{ type: "singleWork" }],
          description: "Link to a case study document",
        }),
        defineField({
          name: "inline",
          title: "Or Create Inline Case Study",
          type: "object",
          description: "If no case study reference, provide details inline",
          fields: [
            defineField({
              name: "client",
              title: "Client Name",
              type: "string",
            }),
            defineField({
              name: "industry",
              title: "Industry",
              type: "string",
            }),
            defineField({
              name: "challenge",
              title: "Challenge",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "solution",
              title: "Solution",
              type: "text",
              rows: 3,
            }),
            defineField({
              name: "results",
              title: "Results & Metrics",
              type: "array",
              of: [
                defineField({
                  type: "object",
                  fields: [
                    defineField({
                      name: "metric",
                      title: "Metric",
                      type: "string",
                    }),
                    defineField({
                      name: "value",
                      title: "Value/Result",
                      type: "string",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // =========== SECTION 7: PRICING & INVESTMENT ===========
    defineField({
      name: "pricingSection",
      title: "7. Pricing & Investment Section",
      type: "object",
      description: "Transparent costs and payment terms",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Investment & Pricing",
        }),
        defineField({
          name: "description",
          title: "Intro Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "pricingModel",
          title: "Pricing Model",
          type: "string",
          options: {
            list: [
              { title: "One-time", value: "one-time" },
              { title: "Monthly Retainer", value: "monthly" },
              { title: "Hourly Rate", value: "hourly" },
              { title: "Custom / Tiered", value: "custom" },
            ],
          },
        }),
        defineField({
          name: "startingPrice",
          title: "Starting Price / Range",
          type: "string",
          description: "e.g., '$5,000' or '$5,000 - $15,000'",
        }),
        defineField({
          name: "monthlyPrice",
          title: "Monthly Price (if applicable)",
          type: "string",
        }),
        defineField({
          name: "paymentTerms",
          title: "Payment Terms",
          type: "text",
          rows: 3,
          description: "e.g., '50% upfront, 50% upon delivery'",
        }),
        defineField({
          name: "included",
          title: "What's Included",
          type: "array",
          of: [{ type: "string" }],
        }),
        defineField({
          name: "excluded",
          title: "What's Not Included",
          type: "array",
          of: [{ type: "string" }],
          description: "Clarify scope limitations",
        }),
      ],
    }),

    // =========== SECTION 8: WHO THIS IS FOR ===========
    defineField({
      name: "whoThisFor",
      title: "8. Who This Is For Section",
      type: "object",
      description: "Ideal client profile and fit criteria",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Who This Service Is For",
        }),
        defineField({
          name: "description",
          title: "Intro Description",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "idealClient",
          title: "Ideal Client Profile",
          type: "text",
          rows: 4,
          description: "Describe your target customer in detail",
        }),
        defineField({
          name: "fitCriteria",
          title: "Good Fit Criteria",
          type: "array",
          of: [{ type: "string" }],
          description: "Signs that a client is a good fit",
        }),
        defineField({
          name: "poorFitCriteria",
          title: "Poor Fit Indicators (Optional)",
          type: "array",
          of: [{ type: "string" }],
          description: "When this service might not be right",
        }),
        defineField({
          name: "industries",
          title: "Target Industries",
          type: "array",
          of: [{ type: "string" }],
        }),
        defineField({
          name: "companySize",
          title: "Company Size Range (Optional)",
          type: "string",
          description: "e.g., 'SMBs with 10-100 employees'",
        }),
        defineField({
          name: "annualRevenue",
          title: "Typical Annual Revenue (Optional)",
          type: "string",
          description: "e.g., '$1M - $50M'",
        }),
      ],
    }),

    // =========== SECTION 9: FAQ ===========
    defineField({
      name: "faq",
      title: "9. FAQ Section",
      type: "object",
      description: "Common objections and questions (8-10 items)",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Frequently Asked Questions",
        }),
        defineField({
          name: "description",
          title: "Intro Description (Optional)",
          type: "text",
          rows: 2,
        }),
        defineField({
          name: "items",
          title: "FAQ Items",
          type: "array",
          of: [
            defineField({
              type: "object",
              fields: [
                defineField({
                  name: "question",
                  title: "Question",
                  type: "string",
                }),
                defineField({
                  name: "answer",
                  title: "Answer",
                  type: "text",
                  rows: 4,
                }),
              ],
            }),
          ],
          validation: (Rule) =>
            Rule.max(15).warning("Consider limiting FAQ to 8-12 items"),
        }),
      ],
    }),

    // =========== SECTION 10: CONVERSION ===========
    defineField({
      name: "conversion",
      title: "10. Conversion Section",
      type: "object",
      description: "Call-to-action, trust signals, and next steps",
      fields: [
        defineField({
          name: "title",
          title: "Section Title",
          type: "string",
          initialValue: "Ready to Get Started?",
        }),
        defineField({
          name: "description",
          title: "Description / Message",
          type: "text",
          rows: 3,
          description: "Final persuasive message before CTA",
        }),
        defineField({
          name: "primaryCta",
          title: "Primary CTA Button",
          type: "object",
          fields: [
            defineField({
              name: "text",
              title: "Button Text",
              type: "string",
              initialValue: "Schedule Consultation",
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
            }),
          ],
        }),
        defineField({
          name: "trustSignals",
          title: "Trust Signals / Social Proof",
          type: "array",
          of: [{ type: "string" }],
          description: "e.g., 'ISO Certified', '500+ clients served', '20+ years experience'",
        }),
        defineField({
          name: "nextSteps",
          title: "Next Steps Description",
          type: "text",
          rows: 3,
          description: "What happens after they click the CTA",
        }),
      ],
    }),

    // =========== RICH BODY CONTENT ===========
    defineField({
      name: "body",
      title: "Additional Body Content",
      description: "Optional rich text content for the service page",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "H2", value: "h2" },
            { title: "H3", value: "h3" },
            { title: "H4", value: "h4" },
            { title: "Quote", value: "blockquote" },
          ],
          marks: {
            decorators: [
              { title: "Bold", value: "strong" },
              { title: "Italic", value: "em" },
              { title: "Code", value: "code" },
            ],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "URL",
                    validation: (Rule) =>
                      Rule.uri({
                        scheme: ["http", "https", "mailto", "tel"],
                      }),
                  },
                ],
              },
            ],
          },
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
        },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alt Text",
            },
            {
              name: "caption",
              type: "string",
              title: "Caption",
            },
          ],
        },
      ],
    }),

    // =========== LEGACY FIELDS (for backward compatibility) ===========
    defineField({
      name: "features",
      title: "Features (Legacy)",
      type: "array",
      of: [{ type: "string" }],
      description: "Key features of this service (deprecated - use What You Get section)",
      hidden: true,
    }),
    defineField({
      name: "outcomes",
      title: "Outcomes (Legacy)",
      type: "array",
      of: [{ type: "string" }],
      description: "Expected outcomes for clients (deprecated)",
      hidden: true,
    }),
    defineField({
      name: "pricing",
      title: "Pricing (Legacy)",
      type: "object",
      description: "Use Pricing Section instead (deprecated)",
      hidden: true,
      fields: [
        defineField({
          name: "startingPrice",
          title: "Starting Price",
          type: "string",
        }),
        defineField({
          name: "monthlyPrice",
          title: "Monthly Price",
          type: "string",
        }),
        defineField({
          name: "pricingModel",
          title: "Pricing Model",
          type: "string",
        }),
        defineField({
          name: "note",
          title: "Note",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO Settings",
      type: "seo",
      options: {
        collapsible: true,
        collapsed: true,
      },
    }),
  ],
  preview: {
    select: {
      title: "title",
      category: "category",
      media: "image",
    },
    prepare({ title, category, media }) {
      return {
        title,
        subtitle: category,
        media,
      };
    },
  },
});
