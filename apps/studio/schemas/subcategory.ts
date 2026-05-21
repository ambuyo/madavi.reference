import { defineField, defineType } from "sanity";

export const subcategory = defineType({
  name: "subcategory",
  title: "Subcategory",
  type: "document",
  fields: [
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
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "category",
      title: "Parent Category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      categoryTitle: "category.title",
    },
    prepare({ title, categoryTitle }: { title: string; categoryTitle?: string }) {
      return {
        title,
        subtitle: categoryTitle ? `In: ${categoryTitle}` : "No category",
      };
    },
  },
});
