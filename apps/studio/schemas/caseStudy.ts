import { defineField, defineType } from "sanity";

export const singleWork = defineType({
  name: "singleWork",
  title: "Our Work",
  type: "document",
  fields: [
    defineField({
      name: "client",
      title: "Client",
      type: "string",
      description: "Name of the client",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "client",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "industry",
      title: "Industry",
      type: "string",
      options: {
        list: [
          { title: "Accelerators/Incubators", value: "accelerators-incubators" },
          { title: "Agriculture", value: "agriculture" },
          { title: "Consortiums", value: "consortiums" },
          { title: "Edtech", value: "edtech" },
          { title: "Foundations", value: "foundations" },
          { title: "Healthcare", value: "healthcare" },
          { title: "Legal & Law Firms", value: "legal-law-firms" },
          { title: "Manufacturing", value: "manufacturing" },
          { title: "Non Profits", value: "non-profits" },
          { title: "Real Estate", value: "real-estate" },
          { title: "Retail & Ecommerce", value: "retail-ecommerce" },
          { title: "Technology", value: "technology" },
          { title: "Services", value: "services" },
          { title: "Venture Capital", value: "venture-capital" },
        ],
      },
      description: "Industry of the client",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "imcServices",
      title: "Integrated Marketing Communications",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "grid",
        list: [
          { title: "Brand Positioning", value: "brand-positioning" },
          { title: "Audience Research", value: "audience-research" },
          { title: "Omnichannel Strategy", value: "omnichannel-strategy" },
          { title: "Pay Per Click", value: "pay-per-click" },
          { title: "Search Engine Marketing", value: "search-engine-marketing" },
          { title: "Media Relations", value: "media-relations" },
          { title: "Crisis Management", value: "crisis-management" },
          { title: "Corporate Communications", value: "corporate-communications" },
          { title: "Content Strategy", value: "content-strategy" },
          { title: "Social Media Management", value: "social-media-management" },
          { title: "Email Marketing", value: "email-marketing" },
          { title: "SMS & WhatsApp Marketing", value: "sms-whatsapp-marketing" },
          { title: "Events Marketing", value: "events-marketing" },
          { title: "Trade Promotions", value: "trade-promotions" },
          { title: "Website Design", value: "website-design" },
          { title: "E-commerce & Web Applications", value: "ecommerce-web-applications" },
          { title: "MarTech & Analytics Integration", value: "martech-analytics-integration" },
          { title: "Dashboards Development", value: "dashboards-development" },
        ],
      },
      description: "IMC services provided to the client",
    }),
    defineField({
      name: "aiStudioServices",
      title: "The AI Studio",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "grid",
        list: [
          { title: "AI & Agentic Workflows", value: "ai-agentic-workflows" },
          { title: "AI Readiness", value: "ai-readiness" },
          { title: "AI Audits", value: "ai-audits" },
          { title: "AI Policy Frameworks", value: "ai-policy-frameworks" },
        ],
      },
      description: "AI Studio services provided to the client",
    }),
    defineField({
      name: "aboutClient",
      title: "About Client",
      type: "text",
      rows: 4,
      description: "The client and the challenge they faced",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "ourProcess",
      title: "Our Process",
      type: "text",
      rows: 4,
      description: "Description of what was done in the project",
    }),
    defineField({
      name: "results",
      title: "Results",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              title: "Label",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: "label",
              subtitle: "value",
            },
          },
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "businessImpact",
      title: "Business Impact",
      type: "text",
      rows: 4,
      description: "The business impact and outcomes achieved for the client",
    }),
    defineField({
      name: "testimonial",
      title: "Testimonial",
      type: "object",
      fields: [
        defineField({
          name: "quote",
          title: "Quote",
          type: "text",
          rows: 3,
        }),
        defineField({
          name: "author",
          title: "Author",
          type: "string",
        }),
        defineField({
          name: "role",
          title: "Role",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "completionDate",
      title: "Completion Date",
      type: "date",
      description: "Date the project was completed",
    }),
    defineField({
      name: "displayOrder",
      title: "Display Order",
      type: "number",
      description: "Controls display order — lower numbers appear first",
    }),
    defineField({
      name: "tagline",
      title: "Project Tagline",
      type: "string",
      description: "Brief tagline for the project",
    }),
    defineField({
      name: "projectUrl",
      title: "Project URL",
      type: "url",
      description: "Link to the live project (optional)",
    }),
    defineField({
      name: "image",
      title: "Image",
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
      name: "projectImages",
      title: "Project Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
            }),
          ],
        },
      ],
      description: "Gallery of project images",
    }),
    defineField({
      name: "pubDate",
      title: "Publish Date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "client",
      media: "image",
    },
    prepare({ title, media }) {
      return {
        title,
        media,
      };
    },
  },
});
