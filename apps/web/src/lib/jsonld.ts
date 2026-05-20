/**
 * JSON-LD Schema Generation Utility
 * Generates structured data for Google and other search engines
 */

export interface JsonLDArticle {
  "@context": string;
  "@type": string;
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    "@type": string;
    name: string;
  };
  publisher?: {
    "@type": string;
    name: string;
    logo: {
      "@type": string;
      url: string;
    };
  };
}

export interface JsonLDOrganization {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contact?: {
    "@type": string;
    contactType: string;
    telephone?: string;
    email?: string;
  };
}

export interface JsonLDBreadcrumb {
  "@context": string;
  "@type": string;
  itemListElement: Array<{
    "@type": string;
    position: number;
    name: string;
    item?: string;
  }>;
}

/**
 * Generate Article JSON-LD schema
 */
export function generateArticleSchema(
  title: string,
  description: string,
  publishedDate: string,
  author: string = "Madavi",
  image?: string,
  modifiedDate?: string
): string {
  const schema: JsonLDArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    datePublished: publishedDate,
    author: {
      "@type": "Person",
      name: author,
    },
  };

  if (image) {
    schema.image = image;
  }

  if (modifiedDate) {
    schema.dateModified = modifiedDate;
  }

  schema.publisher = {
    "@type": "Organization",
    name: "Madavi",
    logo: {
      "@type": "ImageObject",
      url: "https://madavi.agency/logo.png",
    },
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate Organization JSON-LD schema
 */
export function generateOrganizationSchema(
  name: string = "Madavi",
  url: string = "https://madavi.agency",
  description: string = "AI consulting and digital transformation services",
  logo: string = "https://madavi.agency/logo.png",
  sameAs: string[] = [
    "https://linkedin.com/company/madavi",
    "https://twitter.com/madavi",
  ]
): string {
  const schema: JsonLDOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    sameAs,
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate Breadcrumb JSON-LD schema
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{
    name: string;
    url?: string;
  }>
): string {
  const schema: JsonLDBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };

  return JSON.stringify(schema, null, 2);
}

/**
 * Generate a script tag with JSON-LD schema
 */
export function createJsonLDScriptTag(jsonLdString: string): string {
  return `<script type="application/ld+json">${jsonLdString}</script>`;
}
