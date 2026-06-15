/**
 * ZeptoMail — Zoho's transactional email service.
 * Uses the official zeptomail npm package.
 */

import { SendMailClient } from "zeptomail";

const ZEPTO_URL = "https://api.zeptomail.com/v1.1/email";
const ZEPTO_TOKEN = import.meta.env.ZEPTOMAIL_API_KEY;
const ZEPTO_FROM_ADDRESS = import.meta.env.ZEPTOMAIL_FROM_ADDRESS || "noreply@madavi.co";
const ZEPTO_FROM_NAME = import.meta.env.ZEPTOMAIL_FROM_NAME || "Madavi Inc.";

const client = new SendMailClient({
  url: ZEPTO_URL,
  token: ZEPTO_TOKEN,
});

interface Attachment {
  filename: string;
  content: string; // base64
  mimeType: string;
}

interface SendParams {
  toName: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
  attachments?: Attachment[];
}

export async function sendZeptoMail(params: SendParams): Promise<boolean> {
  if (!ZEPTO_TOKEN) {
    console.warn("[ZeptoMail] ZEPTOMAIL_API_KEY not set — skipping send");
    return false;
  }

  try {
    const body: Record<string, unknown> = {
      from: { address: ZEPTO_FROM_ADDRESS, name: ZEPTO_FROM_NAME },
      to: [{ email_address: { address: params.toEmail, name: params.toName } }],
      subject: params.subject,
      htmlbody: params.htmlBody,
    };

    if (params.attachments?.length) {
      body.attachments = params.attachments.map((a) => ({
        content: a.content,
        filename: a.filename,
        mime_type: a.mimeType,
      }));
    }

    const resp = await client.sendMail(body);

    if (resp?.data) {
      console.log(`[ZeptoMail] Sent "${params.subject}" → ${params.toEmail}`);
      return true;
    }

    console.error("[ZeptoMail] Unexpected response:", resp);
    return false;
  } catch (err) {
    console.error("[ZeptoMail] Send failed:", err);
    return false;
  }
}

/**
 * Generate the AI audit report HTML email body
 */
export function buildAuditEmailHtml(params: {
  firstName: string;
  companyName: string;
  scorePct: number;
  scoreLevel: string;
  scoreDesc: string;
  reportUrl: string;
}): string {
  const { firstName, companyName, scorePct, scoreLevel, scoreDesc, reportUrl } =
    params;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F9FAFB; padding: 0; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">

    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="color: #005B65; font-size: 20px; margin: 0;">Madavi</h2>
      <p style="color: #9CA3AF; font-size: 12px; margin: 4px 0 0;">AI Advisory & Digital Transformation</p>
    </div>

    <!-- Hero -->
    <div style="background: #FFFFFF; border-radius: 12px; padding: 32px 24px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
      <p style="font-size: 14px; color: #374151; margin: 0 0 16px;">Hi ${firstName},</p>
      <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 24px;">
        Thank you for completing the Madavi AI Readiness Assessment for <strong>${companyName}</strong>.
        Your full report is attached to this email.
      </p>

      <!-- Score card -->
      <div style="background: #F0FDFA; border-radius: 8px; padding: 24px; text-align: center;">
        <p style="font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your AI Readiness Score</p>
        <div style="font-size: 48px; font-weight: 900; color: #005B65; line-height: 1; margin-bottom: 8px;">${scorePct}<span style="font-size: 20px; color: #9CA3AF;">/100</span></div>
        <p style="font-size: 16px; font-weight: 700; color: #005B65; margin: 0 0 4px;">${scoreLevel}</p>
        <p style="font-size: 13px; color: #6B7280; margin: 0;">${scoreDesc}</p>
      </div>
    </div>

    <!-- What's in the report -->
    <div style="background: #FFFFFF; border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid #E5E7EB;">
      <h3 style="color: #111827; font-size: 15px; margin: 0 0 12px;">Your report covers 6 dimensions:</h3>
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${["AI Adoption", "Strategy & Budget", "Team Readiness", "Data Foundation", "Technical Infrastructure", "Governance & Metrics"].map(
          (d) => `<li style="padding: 4px 0; font-size: 13px; color: #374151;">✓ ${d}</li>`
        ).join("")}
      </ul>
    </div>

    <!-- CTA -->
    <div style="background: #005B65; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 20px;">
      <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 16px;">Our team will reach out within 1 business day to discuss your results.</p>
      <a href="${reportUrl}" style="display: inline-block; background: #FFFFFF; color: #005B65; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 13px;">Download Full Report →</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 16px 0;">
      <p style="font-size: 11px; color: #9CA3AF; margin: 0;">
        Madavi Inc. · hi@madavi.co · madavi.co<br>
        This report was generated for ${firstName} at ${companyName}.
      </p>
    </div>

  </div>
</body>
</html>`;
}
