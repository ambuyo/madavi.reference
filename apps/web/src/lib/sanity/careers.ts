import { getClient } from "./client";

export interface Career {
  _id: string;
  title: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  remote: "On-site" | "Remote" | "Hybrid";
  postedDate: string;
  salary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  applyUrl: string;
  applyEmail: string;
  content?: string;
}

export async function getCareers(): Promise<Career[]> {
  const query = `
    *[_type == "career"] | order(postedDate desc) {
      _id,
      title,
      location,
      type,
      remote,
      postedDate,
      salary,
      description,
      responsibilities,
      requirements,
      benefits,
      applyUrl,
      applyEmail
    }
  `;

  try {
    const careers = await getClient().fetch(query);
    return careers;
  } catch (error) {
    console.error("Error fetching careers from Sanity:", error);
    return getDummyCareers();
  }
}

export async function getCareerById(id: string): Promise<Career | null> {
  const query = `
    *[_type == "career" && _id == $id][0] {
      _id,
      title,
      location,
      type,
      remote,
      postedDate,
      salary,
      description,
      responsibilities,
      requirements,
      benefits,
      applyUrl,
      applyEmail,
      content
    }
  `;

  try {
    const career = await getClient().fetch(query, { id });
    return career || null;
  } catch (error) {
    console.error("Error fetching career from Sanity:", error);
    return getDummyCareerById(id);
  }
}

function getDummyCareers(): Career[] {
  return [
    {
      _id: "1",
      title: "AI Strategy Consultant",
      location: "Nairobi, Kenya",
      type: "Full-time",
      remote: "Hybrid",
      postedDate: "2026-04-15",
      salary: "$80,000 - $120,000",
      description:
        "Join our team as an AI Strategy Consultant and help organizations across Africa navigate their AI transformation journey.",
      responsibilities: [
        "Conduct AI readiness assessments for enterprise clients",
        "Develop and present AI adoption roadmaps",
        "Facilitate executive workshops on AI strategy",
        "Lead implementation planning sessions",
        "Mentor junior consultants on HCAIF Framework",
      ],
      requirements: [
        "5+ years in business strategy or management consulting",
        "Deep understanding of AI technologies and applications",
        "Experience with organizational change management",
        "Strong presentation and stakeholder management skills",
        "Bachelor's degree in business, technology, or related field",
      ],
      benefits: [
        "Competitive salary with performance bonus",
        "Flexible work arrangement",
        "Professional development budget",
        "Health and wellness benefits",
        "Equity participation",
      ],
      applyUrl: "https://careers.madavi.ai/apply/ai-strategy-consultant",
      applyEmail: "careers@madavi.ai",
    },
    {
      _id: "2",
      title: "Executive Coach",
      location: "Kampala, Uganda",
      type: "Full-time",
      remote: "Hybrid",
      postedDate: "2026-04-10",
      salary: "$70,000 - $100,000",
      description:
        "Guide C-suite leaders through AI transformation and organizational change as an Executive Coach.",
      responsibilities: [
        "Conduct one-on-one coaching sessions with senior leaders",
        "Develop personalized leadership development plans",
        "Assess leadership readiness for digital transformation",
        "Facilitate peer learning groups",
        "Track and measure coaching outcomes",
      ],
      requirements: [
        "10+ years in executive coaching or leadership development",
        "Certification in executive coaching",
        "Understanding of organizational dynamics and change management",
        "Experience in technology or digital transformation",
        "Master's degree preferred",
      ],
      benefits: [
        "Competitive salary with performance bonus",
        "Flexible work arrangement",
        "Coaching certification support",
        "Health and wellness benefits",
        "Professional development allowance",
      ],
      applyUrl: "https://careers.madavi.ai/apply/executive-coach",
      applyEmail: "careers@madavi.ai",
    },
    {
      _id: "3",
      title: "Research Analyst - AI Impact",
      location: "Dar es Salaam, Tanzania",
      type: "Full-time",
      remote: "Remote",
      postedDate: "2026-04-05",
      salary: "$50,000 - $70,000",
      description:
        "Research and analyze AI adoption trends, impacts, and best practices across African organizations.",
      responsibilities: [
        "Conduct research on AI adoption patterns in African markets",
        "Analyze case studies of successful AI implementations",
        "Prepare research reports and white papers",
        "Interview organizational leaders and stakeholders",
        "Track and document emerging AI trends",
      ],
      requirements: [
        "3+ years in research or data analysis",
        "Strong writing and communication skills",
        "Understanding of AI technologies and applications",
        "Experience with qualitative and quantitative research methods",
        "Bachelor's degree in relevant field",
      ],
      benefits: [
        "Competitive salary",
        "Fully remote work arrangement",
        "Professional development budget",
        "Health benefits",
        "Learning and development opportunities",
      ],
      applyUrl: "https://careers.madavi.ai/apply/research-analyst",
      applyEmail: "careers@madavi.ai",
    },
  ];
}

function getDummyCareerById(id: string): Career | null {
  const careers = getDummyCareers();
  return careers.find((c) => c._id === id) || null;
}
