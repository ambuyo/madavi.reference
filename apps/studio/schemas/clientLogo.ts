import { defineField, defineType } from "sanity";

export const clientLogo = defineType({
  name: "clientLogo",
  title: "Client Logo",
  type: "document",
  fields: [
    defineField({
      name: "company",
      title: "Company Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo Image",
      type: "image",
      options: {
        hotspot: false,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description: "Logo alt text for accessibility",
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "url",
      title: "Company URL",
      type: "url",
      description: "Optional link to company website",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      description: "Number to control display order (lower numbers appear first)",
    }),
    defineField({
      name: "industry",
      title: "Industry",
      type: "string",
      options: {
        list: [
          { title: "Healthcare", value: "healthcare" },
          { title: "Legal", value: "legal" },
          { title: "Foundations", value: "foundations" },
          { title: "Consortiums", value: "consortiums" },
          { title: "Real Estate", value: "realEstate" },
          { title: "Retail & Ecommerce", value: "retailEcommerce" },
          { title: "Agriculture", value: "agriculture" },
          { title: "Venture Capital", value: "ventureCapital" },
          { title: "Technology", value: "technology" },
          { title: "Manufacturing", value: "manufacturing" },
          { title: "Services", value: "services" },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: "company",
      media: "logo",
    },
  },
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
    {
      title: "Company Name A-Z",
      name: "nameAsc",
      by: [{ field: "company", direction: "asc" }],
    },
  ],
});
