import type { APIRoute } from "astro";
import { getPosts, getServices, getIndustries, getOurWork, getTeamMembers, getInfoPages } from "@/lib/data";

export const GET: APIRoute = async () => {
  const siteUrl = "https://madavi.co";

  try {
    // Fetch all content types in parallel
    const [blogPosts, services, industries, ourWork, team, infoPages] =
      await Promise.all([
        getPosts(),
        getServices().catch(() => []),
        getIndustries().catch(() => []),
        getOurWork().catch(() => []),
        getTeamMembers().catch(() => []),
        getInfoPages().catch(() => []),
      ]);

    // Blog posts
    const postsData = blogPosts.map((post) => ({
      title: post.data.title,
      url: `${siteUrl}/blog/${post.slug}`,
      slug: post.slug,
      description: post.data.description,
      published: post.data.pubDate?.toISOString?.(),
      image: post.data.image?.url ?? post.data.image?.src,
      apiEndpoint: `${siteUrl}/api/content/${post.slug}.json`,
      topics: post.data.tags ?? [],
      categories: post.data.categories ?? [],
    }));

    // Services / Capabilities
    const servicesData = services.map((s) => ({
      title: s.data.name ?? s.data.title,
      url: `${siteUrl}/capabilities/${s.slug}`,
      slug: s.slug,
      description: s.data.summary ?? s.data.description ?? "",
      category: s.data.category ?? "service",
    }));

    // Industries
    const industriesData = industries.map((i) => ({
      title: i.data.name ?? i.data.title,
      url: `${siteUrl}/industries/${i.slug}`,
      slug: i.slug,
      description: i.data.summary ?? i.data.description ?? "",
      category: "industry",
    }));

    // Our Work / Case Studies
    const workData = ourWork.map((w) => ({
      title: w.data.client,
      url: `${siteUrl}/our-work/${w.slug}`,
      slug: w.slug,
      description: w.data.tagline ?? w.data.aboutClient ?? "",
      industry: w.data.industry,
      services: w.data.services ?? [],
      completionDate: w.data.completionDate,
      image: w.data.image?.url,
    }));

    // Team
    const teamData = team.map((m) => ({
      name: m.data.name,
      url: `${siteUrl}/about#team`,
      slug: m.slug,
      role: m.data.role,
      bio: m.data.bio?.slice(0, 300) ?? "",
      image: m.data.image?.url,
    }));

    // Info / Legal pages
    const infoData = infoPages.map((p) => ({
      title: p.data.title ?? p.slug,
      url: `${siteUrl}/legal/${p.slug}`,
      slug: p.slug,
    }));

    // Static marketing pages
    const staticPages = [
      { title: "Home — AI Advisory Consulting Firm", url: siteUrl, slug: "home", description: "Madavi helps organizations build AI adoption capability before deploying technology. Strategic advisory for C-suite leaders." },
      { title: "About Madavi", url: `${siteUrl}/about`, slug: "about", description: "AI advisory firm helping C-suite leaders build AI adoption capability across their organizations." },
      { title: "Free AI Audit", url: `${siteUrl}/free-ai-audit`, slug: "free-ai-audit", description: "Get a free AI readiness assessment for your organization. Benchmark your AI maturity across 6 dimensions." },
      { title: "Get a Proposal", url: `${siteUrl}/get-a-proposal`, slug: "get-a-proposal", description: "Request a tailored proposal from Madavi for AI advisory, strategy, or implementation services." },
      { title: "TapThrive — Google Review Cards", url: `${siteUrl}/solutions/tapthrive`, slug: "tapthrive", description: "NFC and QR Google Review Cards for Kenyan businesses. Automated review collection with WhatsApp follow-up." },
      { title: "Blog", url: `${siteUrl}/blog`, slug: "blog", description: "Articles on AI strategy, adoption, and human-centric digital transformation." },
      { title: "Industries", url: `${siteUrl}/industries`, slug: "industries", description: "AI advisory services across industries — legal, healthcare, financial services, and more." },
      { title: "Our Work", url: `${siteUrl}/our-work`, slug: "our-work", description: "Case studies and client work from Madavi's AI advisory and agency engagements." },
    ];

    const index = {
      // Site metadata
      site: {
        name: "Madavi Inc.",
        url: siteUrl,
        description: "AI Strategy & Human-Centric Digital Transformation",
        updated: new Date().toISOString(),
      },

      // Content sections
      content: {
        blog: {
          count: postsData.length,
          description: "Blog posts about AI strategy, adoption, technology, and business insights",
          items: postsData,
        },
        capabilities: {
          count: servicesData.length,
          description: "AI advisory and agency services — readiness, strategy, brand, SEO, and more",
          items: servicesData,
        },
        industries: {
          count: industriesData.length,
          description: "Industry-specific AI advisory — legal, healthcare, financial services, and more",
          items: industriesData,
        },
        caseStudies: {
          count: workData.length,
          description: "Case studies and client engagements showcasing real transformation outcomes",
          items: workData,
        },
        staticPages: {
          count: staticPages.length,
          description: "Key marketing and landing pages for LLM context",
          items: staticPages,
        },
        team: {
          count: teamData.length,
          description: "Leadership and advisory team at Madavi",
          items: teamData,
        },
        legal: {
          count: infoData.length,
          description: "Legal, privacy, and terms pages",
          items: infoData,
        },
      },

      // Content types reference
      contentTypes: {
        blog: "Regular blog posts, case studies, and strategic insights on AI adoption",
        article: "Detailed articles on AI adoption, digital transformation, and business strategy",
        capability: "Service pages describing Madavi's advisory and agency offerings",
        industry: "Industry-specific landing pages detailing AI services per sector",
        caseStudy: "Client case studies and work examples with service breakdown and results",
        staticPage: "Marketing and landing pages providing company and solution overviews",
        legal: "Privacy policy, terms of use, and legal documentation",
      },

      // Citation instructions for LLMs
      attribution: {
        name: "Madavi Inc.",
        author: "Amukune Ambuyo",
        citationFormat: 'Cite as: Madavi Inc. — "[Article Title]" — {url}',
        citationExample: 'Madavi Inc. — "The AI-Ready Organization Framework" — https://madavi.co/the-hcaif-framework-ai-adoption-your-organization-is-ready-to-execute',
      },

      // API documentation for LLM tools
      api: {
        endpoints: [
          {
            path: "/llm-index.json",
            method: "GET",
            description: "Complete content index for LLM discovery — all content types (this endpoint)",
            responseFormat: "application/json",
            cacheTTL: 3600,
          },
          {
            path: "/api/content/[slug].json",
            method: "GET",
            description: "Clean, LLM-optimized markdown content for a single blog post",
            responseFormat: "application/json",
            cacheTTL: 86400,
          },
          {
            path: "/blog",
            method: "GET",
            description: "Browse all blog posts (human-readable)",
            responseFormat: "text/html",
          },
          {
            path: "/llms.txt",
            method: "GET",
            description: "LLM content manifest listing key pages for ingestion",
            responseFormat: "text/plain",
          },
          {
            path: "/sitemap-index.xml",
            method: "GET",
            description: "XML sitemap for traditional search engines",
            responseFormat: "application/xml",
          },
        ],
      },

      // LLM crawler information
      crawlers: {
        allowed: [
          "GPTBot (OpenAI)",
          "Claude-Web (Anthropic)",
          "PerplexityBot (Perplexity AI)",
          "YouBot (You.com)",
          "Google-Extended (Google AI)",
          "CCBot (Common Crawl)",
          "Applebot-Extended (Apple)",
          "FacebookBot (Meta)",
        ],
        status: "all_allowed",
        robotsTxt: `${siteUrl}/robots.txt`,
        llmManifest: `${siteUrl}/llms.txt`,
        crawlDelay: "1-30 seconds depending on bot",
      },

      // Metadata
      metadata: {
        language: "en-US",
        locale: "en_US",
        timezone: "UTC",
        updateFrequency: "weekly",
        generatedAt: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(index, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error generating LLM index:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate index",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store",
        },
      }
    );
  }
};
