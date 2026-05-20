import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO & Social Media",
  type: "object",
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      description:
        "Ideal length: 50-60 characters. Appears in search results and browser tabs.",
      validation: (Rule) =>
        Rule.max(60).warning(
          "Titles longer than 60 characters may be truncated by search engines."
        ),
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3,
      description:
        "Ideal length: 120-160 characters. A brief summary of the page.",
      validation: (Rule) =>
        Rule.max(160).warning(
          "Descriptions longer than 160 characters may be truncated."
        ),
    }),
    defineField({
      name: "ogImage",
      title: "Open Graph Image (Social Share)",
      type: "image",
      description:
        "Recommended size: 1200x630px. Used when sharing this page on LinkedIn, X, or WhatsApp.",
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
      name: "keywords",
      title: "Keywords",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
      description: "Search terms that describe this page (5-10 keywords)",
    }),
    defineField({
      name: "canonicalUrl",
      title: "Canonical URL",
      type: "url",
      description:
        "Only use this if this page is duplicating content from another URL.",
    }),
  ],
});
