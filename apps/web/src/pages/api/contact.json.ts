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
  budget?: string;
  subject: string;
  message: string;
  submittedAt: string;
}

// ─── Zoho Bigin helpers ───────────────────────────────────────────────────────

async function getZohoToken(): Promise<string> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const res = await fetch(`https://accounts.zoho.${dc}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: import.meta.env.ZOHO_REFRESH_TOKEN ?? "",
      client_id:     import.meta.env.ZOHO_CLIENT_ID ?? "",
      client_secret: import.meta.env.ZOHO_CLIENT_SECRET ?? "",
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) throw new Error(`Zoho token failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function upsertBiginContact(token: string, sub: ContactSubmission): Promise<string> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const parts = sub.name.trim().split(/\s+/);
  const firstName = parts[0];
  const lastName  = parts.slice(1).join(" ") || "—";

  const res = await fetch(`https://www.zohoapis.${dc}/bigin/v2/Contacts`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        First_Name:   firstName,
        Last_Name:    lastName,
        Email:        sub.email,
        Phone:        sub.phone ?? "",
        Account_Name: sub.company ?? "",
        Lead_Source:  sub.service ?? "",
        Audit_Source: "Proposal Form",
        Description:  sub.subject,
      }],
      duplicate_check_fields: ["Email"],
    }),
  });
  const body = await res.json() as any;
  const record = body.data?.[0];
  if (record?.details?.id) return record.details.id as string;
  if (record?.code === "DUPLICATE_DATA") return record.details.duplicate_record.id as string;
  throw new Error(`Contact upsert failed: ${JSON.stringify(body)}`);
}

async function addBiginNote(token: string, contactId: string, sub: ContactSubmission): Promise<void> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const content = `
PROPOSAL REQUEST

Subject:  ${sub.subject}
Service:  ${sub.service || "—"}
Budget:   ${sub.budget || "—"}

Message:
${sub.message}

--- Contact ---
Name:    ${sub.name}
Email:   ${sub.email}
Phone:   ${sub.phone || "—"}
Company: ${sub.company || "—"}
  `.trim();

  await fetch(`https://www.zohoapis.${dc}/bigin/v2/Notes`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        Note_Title:   `Proposal Request — ${sub.subject}`,
        Note_Content: content,
        Parent_Id:    contactId,
        $se_module:   "Contacts",
      }],
    }),
  });
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
    const { name, email, phone, company, service, budget, subject, message, privacy, turnstileToken } =
      body;

    // Turnstile verification — skipped in dev, re-enable before production
    if (process.env.NODE_ENV !== "development") {
      const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
      const turnstileOk = await verifyTurnstile(turnstileToken ?? "", ip);
      if (!turnstileOk) {
        return new Response(
          JSON.stringify({ error: "Bot verification failed", message: "Please complete the security check and try again." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
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
      budget: budget || "",
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
    }

    // Push to Zoho Bigin
    try {
      const zohoToken = await getZohoToken();
      const contactId = await upsertBiginContact(zohoToken, submission);
      await addBiginNote(zohoToken, contactId, submission);
    } catch (biginError: any) {
      console.error("Bigin sync error:", biginError);
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
