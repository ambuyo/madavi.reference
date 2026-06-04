/**
 * One-time Zoho Bigin setup script.
 *
 * Creates all custom fields on Contacts and the AI Audit Leads pipeline.
 * Run once after re-authorising with the settings scopes:
 *   ZohoBigin.settings.CREATE,ZohoBigin.settings.READ,ZohoBigin.settings.UPDATE
 *
 * Usage:
 *   pnpm --filter web setup:bigin
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Load .env manually (no dotenv dep needed) ───────────────────────────────

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key?.trim() && !key.trim().startsWith("#") && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
}

const DC             = process.env.ZOHO_DATACENTER ?? "com";
const REFRESH_TOKEN  = process.env.ZOHO_REFRESH_TOKEN!;
const CLIENT_ID      = process.env.ZOHO_CLIENT_ID!;
const CLIENT_SECRET  = process.env.ZOHO_CLIENT_SECRET!;

if (!REFRESH_TOKEN || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌  Missing ZOHO_REFRESH_TOKEN, ZOHO_CLIENT_ID, or ZOHO_CLIENT_SECRET in .env");
  process.exit(1);
}

// ─── Field definitions ───────────────────────────────────────────────────────

type FieldDef =
  | { label: string; type: "integer" }
  | { label: string; type: "picklist" | "multiselectpicklist"; values: string[] };

const CONTACT_FIELDS: FieldDef[] = [
  { label: "AI Readiness Score",      type: "integer" },
  { label: "Readiness Level",         type: "picklist", values: ["Getting Started","Early Explorer","Strategic Builder","Advanced Adopter","AI-Ready Leader"] },
  { label: "AI Adoption Stage",       type: "picklist", values: ["Not started","Exploring","Piloting","Scaling","Optimizing"] },
  { label: "Decision Authority",      type: "picklist", values: ["Decision-maker","Key influencer","Researcher/evaluator","Other"] },
  { label: "Annual AI Budget",        type: "picklist", values: ["Not yet determined","Under $25K","$25K–$100K","$100K–$500K","$500K+"] },
  { label: "Implementation Timeline", type: "picklist", values: ["Ready now (0–3 months)","Planning (3–6 months)","Exploring (6–12+ months)"] },
  { label: "Primary AI Goal",         type: "picklist", values: ["Efficiency & cost reduction","Revenue growth","Customer experience","Competitive advantage"] },
  { label: "Monthly AI Spend",        type: "picklist", values: ["$0","Less than $500","$500–$2K","$2K–$10K","$10K+"] },
  { label: "Dedicated AI Team",       type: "picklist", values: ["Full dedicated team","Part-time resources","Planning to hire","No team"] },
  { label: "Team Change Readiness",   type: "integer" },
  { label: "Team AI Literacy",        type: "integer" },
  { label: "Leadership Buy In",       type: "picklist", values: ["Strong champion","Supportive","Neutral","Skeptical"] },
  { label: "Data Availability",       type: "picklist", values: ["Clean and accessible","Exists, needs cleaning","Scattered/siloed","Limited infrastructure"] },
  { label: "IT Infrastructure",       type: "picklist", values: ["Cloud-native, API-enabled","Mix of cloud/on-premise","Primarily on-premise","Legacy systems"] },
  { label: "Risk Appetite",           type: "picklist", values: ["Willing to pilot and iterate","Cautious, need proven solutions","Risk-averse, need guarantees"] },
  { label: "Top Challenges",          type: "multiselectpicklist", values: ["Don't know where to start","Lack of internal expertise","Budget constraints","Resistance to change","Data quality issues","Unclear ROI","Vendor selection paralysis"] },
  { label: "Interested In",           type: "multiselectpicklist", values: ["Free consultation call","AI case studies","Personalized AI roadmap","Executive briefing","Custom AI workshop"] },
  { label: "Audit Source",            type: "picklist", values: ["LinkedIn","Google / Search","Referral","Conference / Event","Email / Newsletter","Other"] },
];

const PIPELINE_STAGES = [
  { name: "New Submission",         probability: 10  },
  { name: "Contacted",              probability: 25  },
  { name: "Discovery Call Booked",  probability: 40  },
  { name: "Proposal Sent",          probability: 60  },
  { name: "Negotiation",            probability: 75  },
  { name: "Closed Won",             probability: 100 },
  { name: "Closed Lost",            probability: 0   },
  { name: "Nurture",                probability: 5   },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const res = await fetch(`https://accounts.zoho.${DC}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: REFRESH_TOKEN,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as any;
  if (!data.access_token) {
    console.error("Token response:", JSON.stringify(data, null, 2));
    throw new Error("Failed to get Zoho token. Check credentials and scopes.");
  }
  return data.access_token as string;
}

function fieldPayload(f: FieldDef): Record<string, any> {
  const base: Record<string, any> = {
    field_label: f.label,
    data_type: f.type,
  };
  if (f.type === "picklist" || f.type === "multiselectpicklist") {
    base.pick_list_values = f.values.map(v => ({
      display_value: v,
      actual_value:  v,
      sequence_number: f.values.indexOf(v) + 1,
    }));
  }
  return base;
}

async function createField(token: string, f: FieldDef): Promise<{ label: string; apiName: string }> {
  const res = await fetch(
    `https://www.zohoapis.${DC}/bigin/v2/settings/fields?module=Contacts`,
    {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields: [fieldPayload(f)] }),
    }
  );
  const data = await res.json() as any;
  const field = data.fields?.[0];
  if (field?.status === "success" || field?.details?.api_name) {
    return { label: f.label, apiName: field.details?.api_name ?? "" };
  }
  // Already exists — try to fetch existing
  if (data.status === "error" && data.code === "DUPLICATE_FIELD") {
    console.log(`  ↩  "${f.label}" already exists, skipping`);
    return { label: f.label, apiName: "" };
  }
  console.warn(`  ⚠  "${f.label}" response:`, JSON.stringify(data));
  return { label: f.label, apiName: "" };
}

async function createPipeline(token: string): Promise<string> {
  const res = await fetch(`https://www.zohoapis.${DC}/bigin/v2/Pipelines`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        display_value: "AI Audit Leads",
        stages: PIPELINE_STAGES.map((s, i) => ({
          display_value:     s.name,
          probability:       s.probability,
          sequence_number:   i + 1,
          forecast_category: { name: s.probability === 100 ? "Closed" : s.probability === 0 ? "Omitted" : "Pipeline" },
        })),
      }],
    }),
  });
  const data = await res.json() as any;
  const record = data.data?.[0];
  if (record?.details?.id) return record.details.id as string;
  if (record?.id) return record.id as string;
  console.warn("  ⚠  Pipeline response:", JSON.stringify(data));
  return "";
}

async function getExistingFields(token: string): Promise<Record<string, string>> {
  const res = await fetch(
    `https://www.zohoapis.${DC}/bigin/v2/settings/fields?module=Contacts`,
    { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
  );
  const data = await res.json() as any;
  const map: Record<string, string> = {};
  for (const f of (data.fields ?? [])) {
    map[f.field_label] = f.api_name;
  }
  return map;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀  Zoho Bigin Setup — AI Audit\n");

  console.log("🔑  Getting OAuth token...");
  const token = await getToken();
  console.log("    ✓ Token acquired\n");

  // ── Custom fields ──────────────────────────────────────────────────────────
  console.log(`📋  Creating ${CONTACT_FIELDS.length} custom fields on Contacts...\n`);
  const results: { label: string; apiName: string }[] = [];

  for (const field of CONTACT_FIELDS) {
    process.stdout.write(`  + "${field.label}"... `);
    const r = await createField(token, field);
    results.push(r);
    console.log(r.apiName ? `✓  (${r.apiName})` : "↩  (skipped)");
  }

  // Fetch all fields to fill in any skipped api_names
  console.log("\n🔍  Fetching all Contact field API names...");
  const allFields = await getExistingFields(token);
  for (const r of results) {
    if (!r.apiName && allFields[r.label]) {
      r.apiName = allFields[r.label];
    }
  }

  // ── Pipeline ───────────────────────────────────────────────────────────────
  console.log("\n🔧  Creating AI Audit Leads pipeline...");
  const pipelineId = await createPipeline(token);
  console.log(pipelineId ? `    ✓ Pipeline ID: ${pipelineId}` : "    ↩  Already exists or check manually");

  // ── Output ─────────────────────────────────────────────────────────────────
  console.log("\n\n═══════════════════════════════════════════════");
  console.log("  COPY THESE INTO proposal.json.ts");
  console.log("═══════════════════════════════════════════════\n");

  const fieldMap: Record<string, string> = {};
  for (const r of results) {
    if (r.apiName) fieldMap[r.label] = r.apiName;
  }

  console.log("const BIGIN_FIELDS =", JSON.stringify(fieldMap, null, 2));
  console.log(`\nconst PIPELINE_ID = "${pipelineId}";\n`);

  // Write to a config file for convenience
  const outputPath = path.resolve(process.cwd(), "scripts/bigin-config.json");
  fs.writeFileSync(outputPath, JSON.stringify({ fields: fieldMap, pipelineId }, null, 2));
  console.log(`✅  Config saved to scripts/bigin-config.json\n`);
}

main().catch(e => {
  console.error("\n❌  Setup failed:", e);
  process.exit(1);
});
