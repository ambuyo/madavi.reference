import { getClient } from "./client";

export interface SanityEvent {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  eventType: "workshop" | "webinar" | "conference" | "cohort" | "meeting";
  capacity?: number;
  registrationUrl?: string;
  registrationEmail?: string;
  speakers?: string[];
  price?: string;
  featuredImage?: {
    asset: {
      url: string;
    };
    alt?: string;
  };
}

export async function getEvents(): Promise<SanityEvent[]> {
  const query = `
    *[_type == "event"] | order(startDate asc) {
      _id,
      title,
      slug,
      description,
      startDate,
      endDate,
      location,
      eventType,
      capacity,
      registrationUrl,
      registrationEmail,
      speakers,
      price,
      "featuredImage": {
        "asset": {
          "url": featuredImage.asset->url
        },
        "alt": featuredImage.alt
      }
    }
  `;

  try {
    const events = await getClient().fetch(query);
    return events;
  } catch (error) {
    console.error("Error fetching events from Sanity:", error);
    return getDummyEvents();
  }
}

export async function getEventBySlug(slug: string): Promise<SanityEvent | null> {
  const query = `
    *[_type == "event" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      description,
      startDate,
      endDate,
      location,
      eventType,
      capacity,
      registrationUrl,
      registrationEmail,
      speakers,
      price,
      "featuredImage": {
        "asset": {
          "url": featuredImage.asset->url
        },
        "alt": featuredImage.alt
      }
    }
  `;

  try {
    const event = await getClient().fetch(query, { slug });
    return event || null;
  } catch (error) {
    console.error("Error fetching event from Sanity:", error);
    return getDummyEventBySlug(slug);
  }
}

function getDummyEvents(): SanityEvent[] {
  return [
    {
      _id: "1",
      title: "AI Leadership Cohort",
      slug: { current: "ai-leadership-cohort" },
      description:
        "A comprehensive 12-week cohort for C-suite executives to master AI strategy and implementation.",
      startDate: "2026-06-01T09:00:00Z",
      endDate: "2026-08-31T17:00:00Z",
      location: "Nairobi, Kenya",
      eventType: "cohort",
      capacity: 30,
      registrationUrl: "https://madavi.ai/register/leadership-cohort",
      registrationEmail: "events@madavi.ai",
      speakers: ["Dr. Jane Okonkwo", "Prof. David Kipchoge"],
      price: "$5,000",
    },
    {
      _id: "2",
      title: "Webinar: AI Ethics in Practice",
      slug: { current: "webinar-ai-ethics" },
      description:
        "Join us for an interactive webinar on implementing ethical AI frameworks in your organization.",
      startDate: "2026-05-15T14:00:00Z",
      endDate: "2026-05-15T15:30:00Z",
      location: "Online",
      eventType: "webinar",
      registrationUrl: "https://madavi.ai/register/ethics-webinar",
      registrationEmail: "events@madavi.ai",
      speakers: ["Dr. Amara Obi"],
      price: "Free",
    },
  ];
}

function getDummyEventBySlug(slug: string): SanityEvent | null {
  const events = getDummyEvents();
  return events.find((e) => e.slug.current === slug) || null;
}
