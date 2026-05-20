import { defineField, defineType } from "sanity";

export const solution = defineType({
  name: "solution",
  title: "Solution",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Short Summary",
      type: "text",
      rows: 3,
      description: "Brief summary of the solution",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "paragraph",
      title: "Paragraph",
      type: "array",
      of: [
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 1", value: "h1" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Quote", value: "blockquote" },
          ],
          lists: [
            { title: "Bullet", value: "bullet" },
            { title: "Numbered", value: "number" },
          ],
          marks: {
            decorators: [
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" },
              { title: "Code", value: "code" },
              { title: "Underline", value: "underline" },
            ],
          },
        },
      ],
      description: "Full solution description with rich formatting (bold, lists, headings, etc.)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      description: "Featured image for solution (16:9 landscape - recommended 1200x800px)",
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
          { title: "Venture Capital", value: "venture-capital" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "projectUrl",
      title: "Link to Project URL",
      type: "url",
      description: "External link to the project or case study",
      validation: (Rule) =>
        Rule.required().uri({
          scheme: ["http", "https"],
        }),
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "featuredImage",
      subtitle: "industry",
    },
    prepare({ title, media, subtitle }) {
      return {
        title,
        media,
        subtitle,
      };
    },
  },
  orderings: [
    {
      title: "Title A-Z",
      name: "titleAsc",
      by: [{ field: "name", direction: "asc" }],
    },
    {
      title: "Title Z-A",
      name: "titleDesc",
      by: [{ field: "name", direction: "desc" }],
    },
  ],
});
