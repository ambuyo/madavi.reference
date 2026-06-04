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

  const res = await fetch(`https://www.zohoapis.${DC}/bigin/v2/settings/layouts?module=Pipelines`, {
    headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
  });
  const data = await res.json() as any;
  console.log(JSON.stringify(data, null, 2));
}

main();
