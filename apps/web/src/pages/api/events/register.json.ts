import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { verifyTurnstile } from "@/lib/turnstile";

interface EventRegistration {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  attendeeCount: number;
  dietaryRestrictions?: string;
  specialRequests?: string;
  eventId: string;
  eventTitle: string;
  registeredAt: string;
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "6u680gce",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      company,
      attendeeCount,
      dietaryRestrictions,
      specialRequests,
      eventId,
      eventTitle,
      terms,
      turnstileToken,
    } = body;

    // Turnstile verification
    const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    const turnstileOk = await verifyTurnstile(turnstileToken ?? "", ip);
    if (!turnstileOk) {
      return new Response(
        JSON.stringify({ error: "Bot verification failed", message: "Please complete the security check and try again." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validation
    if (!name || !email || !attendeeCount || !eventId || !terms) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          message: "Please fill in all required fields",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Invalid email address",
          message: "Please provide a valid email",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Attendee count validation
    if (attendeeCount < 1 || attendeeCount > 10) {
      return new Response(
        JSON.stringify({
          error: "Invalid attendee count",
          message: "Number of attendees must be between 1 and 10",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create registration object
    const registration: EventRegistration = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      email,
      phone: phone || "",
      company: company || "",
      attendeeCount,
      dietaryRestrictions: dietaryRestrictions || "",
      specialRequests: specialRequests || "",
      eventId,
      eventTitle,
      registeredAt: new Date().toISOString(),
    };

    // Save to Sanity
    try {
      await client.create({
        _type: "eventRegistration",
        ...registration,
      });
    } catch (sanityError) {
      console.error("Sanity save error:", sanityError);
      // Continue even if Sanity save fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Registration successful! Check your email for details.",
        registration: {
          email: registration.email,
          name: registration.name,
          eventTitle: registration.eventTitle,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Event registration error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process your registration. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
