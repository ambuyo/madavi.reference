import type { StructureBuilder } from "sanity/structure";
import {
  DocumentIcon,
  UsersIcon,
  DocumentTextIcon,
  CogIcon,
  CaseIcon,
  TagIcon,
  EarthGlobeIcon,
  ImageIcon,
  CalendarIcon,
} from "@sanity/icons";

// Singleton document IDs
const SITE_SETTINGS_ID = "siteSettings";

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      // Posts
      S.listItem()
        .title("Blog Posts")
        .icon(DocumentIcon)
        .schemaType("post")
        .child(S.documentTypeList("post").title("Blog Posts")),

      // Team Members
      S.listItem()
        .title("Team")
        .icon(UsersIcon)
        .schemaType("teamMember")
        .child(S.documentTypeList("teamMember").title("Team Members")),

      // Services
      S.listItem()
        .title("Services")
        .id("services")
        .icon(TagIcon)
        .schemaType("service")
        .child(S.documentTypeList("service").title("Services")),

      // Industries
      S.listItem()
        .title("Industries")
        .icon(EarthGlobeIcon)
        .schemaType("industry")
        .child(S.documentTypeList("industry").title("Industries")),

      // Our Work
      S.listItem()
        .title("Our Work")
        .icon(CaseIcon)
        .schemaType("singleWork")
        .child(S.documentTypeList("singleWork").title("Our Work")),

      // Case Studies
      S.listItem()
        .title("Case Studies")
        .id("caseStudies")
        .icon(DocumentTextIcon)
        .schemaType("caseStudy")
        .child(S.documentTypeList("caseStudy").title("Case Studies")),

      // Events
      S.listItem()
        .title("Events")
        .icon(CalendarIcon)
        .schemaType("event")
        .child(S.documentTypeList("event").title("Events")),

      // Client Logos
      S.listItem()
        .title("Client Logos")
        .icon(ImageIcon)
        .schemaType("clientLogo")
        .child(S.documentTypeList("clientLogo").title("Client Logos")),

      // Reports
      S.listItem()
        .title("Reports")
        .icon(DocumentTextIcon)
        .schemaType("report")
        .child(S.documentTypeList("report").title("Reports")),

      // Solutions
      S.listItem()
        .title("Solutions")
        .icon(DocumentTextIcon)
        .schemaType("solution")
        .child(S.documentTypeList("solution").title("Solutions")),

      // Info Pages (Legal)
      S.listItem()
        .title("Info Pages")
        .icon(DocumentTextIcon)
        .schemaType("infoPage")
        .child(S.documentTypeList("infoPage").title("Info Pages")),

      S.divider(),

      // Site Settings (singleton)
      S.listItem()
        .title("Site Settings")
        .icon(CogIcon)
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId(SITE_SETTINGS_ID)
            .title("Site Settings")
        ),
    ]);
