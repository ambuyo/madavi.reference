import { defineField, defineType } from "sanity";

export const caseStudyDeep = defineType({
  name: "caseStudy",
  title: "Case Studies",
  type: "document",
  fields: [
    // ── 1. Client Name ──────────────────────────────────────────────────
    defineField({
      name: "clientName",
      title: "Client Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "clientName", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),

    // ── 2. Company Logo ──────────────────────────────────────────────────
    defineField({
      name: "companyLogo",
      title: "Company Logo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string" }),
      ],
    }),

    // ── 3. Tenure in Years ───────────────────────────────────────────────
    defineField({
      name: "tenureYears",
      title: "Tenure in Years",
      type: "number",
      description: "How long Madavi has worked with this client",
    }),

    // ── 4. Madavi Services Offered ───────────────────────────────────────
    defineField({
      name: "servicesOffered",
      title: "Madavi Services Offered",
      type: "array",
      of: [{ type: "reference", to: [{ type: "service" }] }],
      description: "Select all services Madavi delivered for this client",
    }),

    // ── 5. Technologies Used ─────────────────────────────────────────────
    defineField({
      name: "technologies",
      title: "Technologies Used",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      description: "Add each technology as a tag (e.g. HubSpot, Meta Ads, n8n)",
    }),

    // ── 6. Industries ────────────────────────────────────────────────────
    defineField({
      name: "industries",
      title: "Industries",
      type: "array",
      of: [{ type: "reference", to: [{ type: "industry" }] }],
      description: "Select all relevant industries",
    }),

    // ── 7. Case Study Title ──────────────────────────────────────────────
    defineField({
      name: "caseStudyTitle",
      title: "Case Study Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    // ── 8. Case Study Synopsis ───────────────────────────────────────────
    defineField({
      name: "synopsis",
      title: "Case Study Synopsis",
      type: "text",
      rows: 4,
      description: "1–2 paragraph overview of the engagement and outcome",
      validation: (Rule) => Rule.required(),
    }),

    // ── 9. Before & After Madavi ─────────────────────────────────────────
    defineField({
      name: "beforeAfter",
      title: "Before & After Madavi",
      type: "object",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: "before",
          title: "Before Madavi (4 bullet points)",
          type: "array",
          of: [{ type: "string" }],
          validation: (Rule) => Rule.max(4).min(1),
          description: "Challenges or state of the business before Madavi",
        }),
        defineField({
          name: "after",
          title: "After Madavi (4 bullet points)",
          type: "array",
          of: [{ type: "string" }],
          validation: (Rule) => Rule.max(4).min(1),
          description: "Outcomes and improvements achieved with Madavi",
        }),
      ],
    }),

    // ── 10. Client Intro ─────────────────────────────────────────────────
    defineField({
      name: "clientIntro",
      title: "Client Intro",
      type: "object",
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({
          name: "image",
          title: "Image",
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt Text", type: "string" }),
          ],
        }),
        defineField({
          name: "paragraph",
          title: "Paragraph",
          type: "text",
          rows: 5,
          description: "Background on the client — who they are, what they do",
        }),
      ],
    }),

    // ── 11. Madavi Strategic Approach ────────────────────────────────────
    defineField({
      name: "strategicApproach",
      title: "The Madavi Strategic Approach",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "subtitle",
              title: "Subtitle / Description",
              type: "text",
              rows: 3,
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "subtitle" },
          },
        },
      ],
      description: "List of strategic steps or pillars — title + description each",
    }),

    // ── 12. Impact Stats (6) ─────────────────────────────────────────────
    defineField({
      name: "impactStats",
      title: "Impact Stats",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Stat / Number",
              type: "string",
              description: "e.g. '3×', '+40%', 'KSh 12M'",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "subtitle",
              title: "Label / Description",
              type: "string",
              description: "e.g. 'increase in organic traffic'",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "subtitle" },
          },
        },
      ],
      validation: (Rule) => Rule.max(6).min(1),
      description: "Up to 6 impact statistics to showcase results",
    }),
  ],

  preview: {
    select: {
      title: "clientName",
      subtitle: "caseStudyTitle",
      media: "companyLogo",
    },
    prepare({ title, subtitle, media }) {
      return { title, subtitle, media };
    },
  },
});
