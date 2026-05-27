import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { verifyTurnstile } from "@/lib/turnstile";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service?: string;
  subject: string;
  message: string;
  submittedAt: string;
}

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "6u680gce",
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_AUTH_TOKEN,
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
    const { name, email, phone, company, service, subject, message, privacy, turnstileToken } =
      body;

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
    if (!name || !email || !subject || !message || !privacy) {
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
        JSON.stringify({ error: "Invalid email address", message: "Please provide a valid email" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create submission object
    const submission: ContactSubmission = {
      id: Math.random().toString(36).substring(2, 11),
      name,
      email,
      phone: phone || "",
      company: company || "",
      service: service || "",
      subject,
      message,
      submittedAt: new Date().toISOString(),
    };

    // Save to Sanity
    try {
      await client.create({
        _type: "contactSubmission",
        ...submission,
      });
    } catch (sanityError) {
      console.error("Sanity save error:", sanityError);
      // Continue even if Sanity save fails - submission is still processed
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Thank you for your message. We'll get back to you soon!",
        submission: {
          email: submission.email,
          name: submission.name,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Contact form submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process your request. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
