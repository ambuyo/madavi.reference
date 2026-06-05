import type { APIRoute } from "astro";
import { verifyTurnstile } from "@/lib/turnstile";

async function getZohoToken(): Promise<string> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`https://accounts.zoho.${dc}/oauth/v2/token`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: import.meta.env.ZOHO_REFRESH_TOKEN,
        client_id:     import.meta.env.ZOHO_CLIENT_ID,
        client_secret: import.meta.env.ZOHO_CLIENT_SECRET,
        grant_type:    "refresh_token",
      }),
    });
    const data = await res.json();
    if (!data.access_token) throw new Error(`Zoho token failed: ${JSON.stringify(data)}`);
    return data.access_token;
  } finally {
    clearTimeout(timer);
  }
}

async function timedFetch(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function upsertContact(token: string, firstName: string, lastName: string, email: string): Promise<string> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const res = await timedFetch(`https://www.zohoapis.${dc}/bigin/v2/Contacts`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{ First_Name: firstName, Last_Name: lastName, Email: email }],
      duplicate_check_fields: ["Email"],
    }),
  });
  const body = await res.json();
  const record = body.data?.[0];
  if (record?.details?.id) return record.details.id as string;
  if (record?.code === "DUPLICATE_DATA") return record.details.duplicate_record.id as string;
  throw new Error(`Contact upsert failed: ${JSON.stringify(body)}`);
}

async function addNewsletterNote(token: string, contactId: string, interest: string): Promise<void> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  await timedFetch(`https://www.zohoapis.${dc}/bigin/v2/Notes`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        Note_Title:   "Newsletter Subscription",
        Note_Content: `Subscribed via madavi.co/newsletter\nAreas of Interest: ${interest}\nDate: ${new Date().toISOString()}`,
        Parent_Id:    contactId,
        $se_module:   "Contacts",
      }],
    }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { firstName, lastName, email, interest, privacy, turnstileToken } = body;

    if (!firstName || !lastName || !email || !privacy) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", message: "Please fill in all required fields." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address", message: "Please provide a valid email address." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    const turnstileOk = await verifyTurnstile(turnstileToken ?? "", ip);
    if (!turnstileOk) {
      return new Response(
        JSON.stringify({ error: "Bot verification failed", message: "Please complete the security check and try again." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const zohoToken = await getZohoToken();
    const contactId = await upsertContact(zohoToken, firstName, lastName, email);
    await addNewsletterNote(zohoToken, contactId, interest || "all");

    return new Response(
      JSON.stringify({ success: true, message: "Successfully subscribed to newsletter." }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: "Failed to process subscription. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
