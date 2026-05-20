import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@sanity/client";
import matter from "gray-matter";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Sanity client configuration
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_AUTH_TOKEN,
  useCdn: false,
});

// Paths
const INDUSTRIES_DIR = path.join(
  __dirname,
  "../../web/src/content/industries"
);

/**
 * Download and upload image to Sanity
 */
async function uploadImageToSanity(imageUrl, altText) {
  try {
    if (!imageUrl) return null;

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`Failed to download image: ${imageUrl}`);
      return null;
    }

    const buffer = await response.arrayBuffer();

    // Upload to Sanity
    const asset = await client.assets.upload("image", Buffer.from(buffer), {
      filename: path.basename(imageUrl),
      description: altText,
    });

    return {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: asset._id,
      },
      alt: altText,
    };
  } catch (error) {
    console.warn(`Error uploading image ${imageUrl}:`, error.message);
    return null;
  }
}

/**
 * Parse and migrate a single industry markdown file
 */
async function migrateIndustry(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const { data: frontmatter, content: body } = matter(content);

    console.log(`Migrating: ${fileName}`);

    // Store hero image URL directly (don't upload)
    let heroImage = null;
    if (frontmatter.hero?.image) {
      heroImage = {
        _type: "object",
        url: frontmatter.hero.image,
      };
    }

    // Build the Sanity document
    const doc = {
      _type: "industry",
      title: frontmatter.title,
      slug: {
        _type: "slug",
        current: frontmatter.slug,
      },
      summary: frontmatter.summary,
      description: frontmatter.description,

      // SEO fields
      seo: frontmatter.seo
        ? {
            _type: "seo",
            metaTitle: frontmatter.seo.title,
            metaDescription: frontmatter.seo.description,
            keywords: frontmatter.seo.keywords,
            canonicalUrl: frontmatter.seo.canonical,
          }
        : undefined,

      // Social media
      og: frontmatter.og
        ? {
            _type: "object",
            title: frontmatter.og.title,
            description: frontmatter.og.description,
            type: frontmatter.og.type,
          }
        : undefined,

      twitter: frontmatter.twitter
        ? {
            _type: "object",
            card: frontmatter.twitter.card,
            title: frontmatter.twitter.title,
            description: frontmatter.twitter.description,
          }
        : undefined,

      // Hero section
      hero: frontmatter.hero
        ? {
            _type: "object",
            breadcrumb: frontmatter.hero.breadcrumb,
            kicker: frontmatter.hero.kicker,
            headline: frontmatter.hero.headline,
            description: frontmatter.hero.description,
            backgroundColor: frontmatter.hero.backgroundColor,
            image: heroImage,
          }
        : undefined,

      // Three tier problems
      threeTierProblems: frontmatter.threeTierProblems
        ? {
            _type: "object",
            title: frontmatter.threeTierProblems.title,
            description: frontmatter.threeTierProblems.description,
            tiers: frontmatter.threeTierProblems.tiers?.map((tier) => ({
              _type: "object",
              title: tier.title,
              benefit: tier.benefit,
              description: tier.description,
              backgroundColor: tier.backgroundColor,
            })),
          }
        : undefined,

      // Benefits section
      benefits: frontmatter.benefits
        ? {
            _type: "object",
            number: frontmatter.benefits.number,
            title: frontmatter.benefits.title,
            subtitle: frontmatter.benefits.subtitle,
            benefitItems: frontmatter.benefits.benefitItems?.map((item) => ({
              _type: "object",
              title: item.title,
              description: item.description,
            })),
            deliveryItems: frontmatter.benefits.deliveryItems?.map((item) => ({
              _type: "object",
              title: item.title,
              description: item.description,
              backgroundColor: item.backgroundColor,
            })),
          }
        : undefined,

      // Value proposition
      valueProposition: frontmatter.valueProposition
        ? {
            _type: "object",
            title: frontmatter.valueProposition.title,
            description: frontmatter.valueProposition.description,
            narrativeParagraphs:
              frontmatter.valueProposition.narrativeParagraphs,
          }
        : undefined,

      // ROI section
      roi: frontmatter.roi
        ? {
            _type: "object",
            title: frontmatter.roi.title,
            beforeSection: {
              _type: "object",
              title: frontmatter.roi.beforeSection?.title,
              stats: frontmatter.roi.beforeSection?.stats?.map((stat) => ({
                _type: "object",
                label: stat.label,
                value: stat.value,
              })),
            },
            afterSection: {
              _type: "object",
              title: frontmatter.roi.afterSection?.title,
              stats: frontmatter.roi.afterSection?.stats?.map((stat) => ({
                _type: "object",
                label: stat.label,
                value: stat.value,
              })),
            },
            investment: frontmatter.roi.investment,
            netBenefit: frontmatter.roi.netBenefit,
            roiPercentage: frontmatter.roi.roiPercentage,
            secondaryBenefits: frontmatter.roi.secondaryBenefits?.map(
              (benefit) => ({
                _type: "object",
                title: benefit.title,
                description: benefit.description,
              })
            ),
          }
        : undefined,

      // Blog section
      blog: frontmatter.blog
        ? {
            _type: "object",
            title: frontmatter.blog.title,
            description: frontmatter.blog.description,
            category: frontmatter.blog.category,
          }
        : undefined,

      // FAQs section
      faqs: frontmatter.faqs
        ? {
            _type: "object",
            slug: frontmatter.faqs.slug,
            title: frontmatter.faqs.title,
            description: frontmatter.faqs.description,
          }
        : undefined,

      // Legacy fields (for compatibility)
      painPoints: frontmatter.painPoints,
      relevantServices: frontmatter.relevantServices,
    };

    // Remove undefined fields
    Object.keys(doc).forEach((key) => doc[key] === undefined && delete doc[key]);

    // Generate _id for the document
    doc._id = `industry-${frontmatter.slug}`;

    // Create or update the document in Sanity
    // First, try to delete existing document to avoid conflicts
    try {
      await client.delete(doc._id);
    } catch (e) {
      // Document doesn't exist, that's fine
    }

    // Create the document
    const result = await client.create(doc);
    console.log(`✓ Created/updated: ${result.title} (ID: ${result._id})`);
    return result;
  } catch (error) {
    console.error(`✗ Error migrating ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateAllIndustries() {
  try {
    console.log("Starting industries migration to Sanity...\n");

    // Get all markdown files
    const files = fs
      .readdirSync(INDUSTRIES_DIR)
      .filter((file) => file.endsWith(".md"));

    if (files.length === 0) {
      console.log("No markdown files found in industries directory");
      return;
    }

    console.log(`Found ${files.length} industry files to migrate\n`);

    const results = [];

    // Migrate each file
    for (const file of files) {
      const filePath = path.join(INDUSTRIES_DIR, file);
      try {
        const doc = await migrateIndustry(filePath, file);
        results.push({ file, status: "success", doc });
      } catch (error) {
        results.push({ file, status: "error", error: error.message });
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(50));

    const successful = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "error").length;

    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);

    if (failed > 0) {
      console.log("\nFailed files:");
      results.forEach((r) => {
        if (r.status === "error") {
          console.log(`  - ${r.file}: ${r.error}`);
        }
      });
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateAllIndustries();
