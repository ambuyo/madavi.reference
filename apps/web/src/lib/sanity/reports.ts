import { client } from "./client";

export interface SanityReport {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  summary: string;
  industry: string;
  publicationDate: string;
  compiledBy: string;
  fullSummary?: any[];
  reportCoverImage?: {
    asset: {
      url: string;
    };
    alt?: string;
  };
  featuredImage?: {
    asset: {
      url: string;
    };
    alt?: string;
  };
  fullReport?: {
    asset: {
      url: string;
    };
  };
}

export interface SanitySolution {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  summary: string;
  industry: string;
  paragraph?: any[];
  projectUrl: string;
  featuredImage?: {
    asset: {
      url: string;
    };
    alt?: string;
  };
}

export async function getReports(): Promise<SanityReport[]> {
  const query = `
    *[_type == "report"] | order(publicationDate desc) {
      _id,
      name,
      slug,
      summary,
      industry,
      publicationDate,
      compiledBy,
      fullSummary,
      "reportCoverImage": {
        "asset": {
          "url": reportCoverImage.asset->url
        },
        "alt": reportCoverImage.alt
      },
      "featuredImage": {
        "asset": {
          "url": featuredImage.asset->url
        },
        "alt": featuredImage.alt
      },
      "fullReport": {
        "asset": {
          "url": fullReport.asset->url
        }
      }
    }
  `;

  try {
    const reports = await client.fetch(query);
    return reports;
  } catch (error) {
    console.error("Error fetching reports from Sanity:", error);
    return [];
  }
}

export async function getReportBySlug(slug: string): Promise<SanityReport | null> {
  const query = `
    *[_type == "report" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      summary,
      industry,
      publicationDate,
      compiledBy,
      fullSummary,
      "reportCoverImage": {
        "asset": {
          "url": reportCoverImage.asset->url
        },
        "alt": reportCoverImage.alt
      },
      "featuredImage": {
        "asset": {
          "url": featuredImage.asset->url
        },
        "alt": featuredImage.alt
      },
      "fullReport": {
        "asset": {
          "url": fullReport.asset->url
        }
      }
    }
  `;

  try {
    const report = await client.fetch(query, { slug });
    return report || null;
  } catch (error) {
    console.error("Error fetching report from Sanity:", error);
    return null;
  }
}

export async function getSolutions(): Promise<SanitySolution[]> {
  const query = `
    *[_type == "solution"] | order(name asc) {
      _id,
      name,
      slug,
      summary,
      industry,
      paragraph,
      projectUrl,
      "featuredImage": {
        "asset": {
          "url": featuredImage.asset->url
        },
        "alt": featuredImage.alt
      }
    }
  `;

  try {
    const solutions = await client.fetch(query);
    return solutions;
  } catch (error) {
    console.error("Error fetching solutions from Sanity:", error);
    return [];
  }
}

export async function getSolutionBySlug(slug: string): Promise<SanitySolution | null> {
  const query = `
    *[_type == "solution" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      summary,
      industry,
      paragraph,
      projectUrl,
      "featuredImage": {
        "asset": {
          "url": featuredImage.asset->url
        },
        "alt": featuredImage.alt
      }
    }
  `;

  try {
    const solution = await client.fetch(query, { slug });
    return solution || null;
  } catch (error) {
    console.error("Error fetching solution from Sanity:", error);
    return null;
  }
}
