import { defineField, defineType } from "sanity";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "IMC Services", value: "imc" },
          { title: "AI Studio Services", value: "ai-studio" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "icon",
      title: "Icon",
      type: "string",
      description: "Lucide icon name used to render this service",
      options: {
        list: [
          // IMC Services
          { title: "Target (Brand Positioning)", value: "Target" },
          { title: "Users (Audience Research)", value: "Users" },
          { title: "Layers (Omnichannel Strategy)", value: "Layers" },
          { title: "MousePointerClick (Pay Per Click)", value: "MousePointerClick" },
          { title: "Search (Search Engine Marketing)", value: "Search" },
          { title: "Newspaper (Media Relations)", value: "Newspaper" },
          { title: "ShieldAlert (Crisis Management)", value: "ShieldAlert" },
          { title: "Building2 (Corporate Communications)", value: "Building2" },
          { title: "FileText (Content Strategy)", value: "FileText" },
          { title: "Share2 (Social Media Management)", value: "Share2" },
          { title: "Mail (Email Marketing)", value: "Mail" },
          { title: "MessageCircle (SMS & WhatsApp Marketing)", value: "MessageCircle" },
          { title: "Calendar (Events Marketing)", value: "Calendar" },
          { title: "Tag (Trade Promotions)", value: "Tag" },
          { title: "Globe (Website Design)", value: "Globe" },
          { title: "ShoppingCart (E-commerce & Web Applications)", value: "ShoppingCart" },
          { title: "BarChart3 (MarTech & Analytics Integration)", value: "BarChart3" },
          { title: "LayoutDashboard (Dashboards Development)", value: "LayoutDashboard" },
          // AI Studio Services
          { title: "Bot (AI Agents)", value: "Bot" },
          { title: "Workflow (AI Workflows)", value: "Workflow" },
          { title: "Gauge (AI Readiness)", value: "Gauge" },
          { title: "ClipboardCheck (AI Audits)", value: "ClipboardCheck" },
          { title: "FileShield (AI Policy Frameworks)", value: "FileShield" },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "image",
      subtitle: "description",
    },
  },
});
