/// <reference types="astro/client" />

interface ImportMetaEnv {
  // ── Sanity CMS ──
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;
  readonly SANITY_PROJECT_ID: string;
  readonly SANITY_DATASET: string;
  readonly SANITY_API_VERSION: string;
  readonly SANITY_READ_TOKEN?: string;

  // ── Cloudflare Turnstile ──
  readonly PUBLIC_TURNSTILE_SITE_KEY: string;
  readonly TURNSTILE_SECRET_KEY: string;

  // ── ZeptoMail (Zoho Email) ──
  readonly ZEPTOMAIL_API_KEY: string;
  readonly ZEPTOMAIL_FROM_ADDRESS: string;
  readonly ZEPTOMAIL_FROM_NAME: string;

  // ── Zoho Bigin CRM ──
  readonly ZOHO_DATACENTER: string;
  readonly ZOHO_REFRESH_TOKEN: string;
  readonly ZOHO_CLIENT_ID: string;
  readonly ZOHO_CLIENT_SECRET: string;

  // ── Webhook ──
  readonly WEBHOOK_SECRET: string;

  // ── Analytics ──
  readonly PUBLIC_GA4_ID?: string;
  readonly GA4_ID?: string;
  readonly META_PIXEL_ID?: string;

  // ── WordPress / CDN ──
  readonly PUBLIC_R2_CDN_URL: string;

  // ── Deploy ──
  readonly DEPLOY_TARGET?: "vps" | "cloudflare" | "netlify";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
