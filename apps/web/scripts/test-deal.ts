/**
 * Probes which Stage values are valid for AI Audit Leads Standard sub-pipeline
 */
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(process.cwd(), ".env");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key?.trim() && !key.trim().startsWith("#") && !process.env[key.trim()]) {
    process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
  }
}

const DC = process.env.ZOHO_DATACENTER ?? "com";

const STAGES = ["New Submission"];
// Try different Sub_Pipeline formats
const VARIANTS: Record<string, any>[] = [
  { Sub_Pipeline: "AI Audit Leads Standard" },
  { Sub_Pipeline: "AI Audit Leads Standard", Pipeline: "6692838000000650183" },
  { Sub_Pipeline: "AI Audit Leads Standard", Pipeline: 6692838000000650183 },
  { Pipeline: "6692838000000650183" },
  { Pipeline: 6692838000000650183 },
];

async function main() {
  const tokenRes = await fetch(`https://accounts.zoho.${DC}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
      client_id:     process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      grant_type:    "refresh_token",
    }),
  });
  const { access_token } = await tokenRes.json() as any;

  console.log("🔍  Probing pipeline variant combinations...\n");

  for (const variant of VARIANTS) {
    const payload = {
      $layout_id:   "6692838000000650023",
      Deal_Name:    `TEST`,
      Stage:        "New Submission",
      Contact_Name: { id: "6692838000000649043" },
      ...variant,
    };
    const res = await fetch(`https://www.zohoapis.${DC}/bigin/v2/Pipelines`, {
      method: "POST",
      headers: { Authorization: `Zoho-oauthtoken ${access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [payload] }),
    });
    const data = await res.json() as any;
    const record = data.data?.[0];
    const label = JSON.stringify(variant);
    if (record?.status === "success") {
      console.log(`✅  ${label} → ID: ${record.details?.id}`);
      const id = record.details?.id;
      if (id) await fetch(`https://www.zohoapis.${DC}/bigin/v2/Pipelines?ids=${id}`, {
        method: "DELETE", headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
      });
    } else {
      console.log(`❌  ${label}\n    → ${record?.code}: ${record?.message} | ${JSON.stringify(record?.details)}`);
    }
  }
}

main();
