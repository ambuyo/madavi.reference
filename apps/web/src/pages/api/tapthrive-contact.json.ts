import type { APIRoute } from "astro";
import { verifyTurnstile } from "@/lib/turnstile";

// ─── Zoho helpers ─────────────────────────────────────────────────────────────

async function getZohoToken(): Promise<string> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const res = await fetch(`https://accounts.zoho.${dc}/oauth/v2/token`, {
    method: "POST",
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
}

async function upsertAccount(token: string, businessName: string): Promise<string> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const res = await fetch(`https://www.zohoapis.${dc}/bigin/v2/Accounts`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{ Account_Name: businessName }],
      duplicate_check_fields: ["Account_Name"],
    }),
  });
  const body = await res.json() as any;
  const record = body.data?.[0];
  if (record?.details?.id) return record.details.id as string;
  if (record?.code === "DUPLICATE_DATA") return record.details.duplicate_record.id as string;
  throw new Error(`Account upsert failed: ${JSON.stringify(body)}`);
}

async function upsertContact(token: string, f: any, accountId: string): Promise<string> {
  const dc       = import.meta.env.ZOHO_DATACENTER ?? "com";
  const fullName = ((f.name as string) || "Unknown").trim();

  const res = await fetch(`https://www.zohoapis.${dc}/bigin/v2/Contacts`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        Last_Name:    fullName,
        Phone:        f.whatsapp ?? "",
        Account_Name: { id: accountId },
        Lead_Source:  "TapThrive ContactForm",
        Description:  `Type: ${f.businessType ?? "—"} | Plan: ${f.plan ?? "—"} | Locations: ${f.locations ?? "—"}`,
      }],
      duplicate_check_fields: ["Phone"],
    }),
  });

  const body = await res.json() as any;
  const record = body.data?.[0];
  if (record?.details?.id) return record.details.id as string;
  if (record?.code === "DUPLICATE_DATA") return record.details.duplicate_record.id as string;
  throw new Error(`Contact upsert failed: ${JSON.stringify(body)}`);
}


async function createNote(token: string, contactId: string, f: any): Promise<void> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  await fetch(`https://www.zohoapis.${dc}/bigin/v2/Notes`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [{
        Note_Title:   `TapThrive Demo Request — ${f.business}`,
        Note_Content: buildNoteContent(f),
        Parent_Id:    contactId,
        $se_module:   "Contacts",
      }],
    }),
  });
}

function buildNoteContent(f: any): string {
  return `
TAPTHRIVE DEMO REQUEST

Business:      ${f.business}
Business Type: ${f.businessType || "—"}
Plan:          ${f.plan || "—"}
Locations:     ${f.locations || "—"}
Has GMB:       ${f.hasGMB || "—"}
WhatsApp:      ${f.whatsapp}
Lead Source:   TapThrive ContactForm
Question:      ${f.question || "None"}
  `.trim();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { turnstileToken, ...form } = body;

    if (!form.name || !form.whatsapp || !form.business || !form.privacy) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", message: "Please fill in all required fields." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Turnstile verification — temporarily disabled
    // if (!import.meta.env.DEV) {
    //   const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
    //   const ok = await verifyTurnstile(turnstileToken ?? "", ip);
    //   if (!ok) {
    //     return new Response(
    //       JSON.stringify({ error: "Bot verification failed", message: "Please complete the security check and try again." }),
    //       { status: 400, headers: { "Content-Type": "application/json" } }
    //     );
    //   }
    // }

    const zohoToken = await getZohoToken();
    const accountId = await upsertAccount(zohoToken, form.business);
    const contactId = await upsertContact(zohoToken, form, accountId);
    await createNote(zohoToken, contactId, form);

    return new Response(
      JSON.stringify({ success: true, message: "Demo request sent! We'll be in touch within one business day." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("TapThrive submission error:", err);
    return new Response(
      JSON.stringify({ error: "Submission failed. Please try again.", detail: err?.message ?? String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
