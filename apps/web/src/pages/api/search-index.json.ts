export const prerender = true;

import {
  getPosts,
  getServices,
  getIndustries,
  getOurWork,
  getTeamMembers,
  getInfoPages,
} from "@/lib/data";

export async function GET() {
  const [postsData, servicesData, industriesData, ourWorkData, teamData, infopagesData] =
    await Promise.all([
      getPosts(),
      getServices(),
      getIndustries(),
      getOurWork(),
      getTeamMembers(),
      getInfoPages(),
    ]);

  const content = [
    ...postsData.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      date: p.data.pubDate,
      slug: p.slug,
      type: "post",
      category: "Blog Post",
    })),
    ...servicesData.map((s) => ({
      title: s.data.title,
      description: s.data.summary,
      date: s.data.pubDate || s.data.updatedDate,
      slug: s.slug,
      type: "service",
      category: s.data.category,
    })),
    ...industriesData.map((i) => ({
      title: i.data.title,
      description: i.data.summary,
      slug: i.slug,
      type: "industry",
      category: "Industry",
    })),
    ...ourWorkData.map((w) => ({
      title: w.data.client,
      description: w.data.aboutClient || w.data.tagline || `Our work with ${w.data.client}`,
      date: w.data.pubDate,
      slug: w.slug,
      type: "ourWork",
      category: w.data.industry,
    })),
    ...teamData.map((m) => ({
      title: m.data.name,
      description: m.data.bio || m.data.role || "",
      slug: m.slug,
      type: "team",
      category: "Team Member",
    })),
    ...infopagesData.map((p) => ({
      title: p.data.page,
      description: `Information page: ${p.data.page}`,
      date: p.data.pubDate,
      slug: p.slug,
      type: "infopage",
      category: "Legal",
    })),
  ];

  return new Response(JSON.stringify(content), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
