import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ── Reports bucket config ────────────────────────────────────────────────────

const REPORTS_ENDPOINT =
  import.meta.env.R2_REPORTS_ENDPOINT ||
  "https://33f62307b9933eaa462e16f41ca9b07a.r2.cloudflarestorage.com";

const REPORTS_BUCKET = import.meta.env.R2_REPORTS_BUCKET || "madavi-reports";
const REPORTS_FOLDER = import.meta.env.R2_REPORTS_FOLDER || "ai-audits";

const REPORTS_ACCESS_KEY = import.meta.env.R2_REPORTS_ACCESS_KEY_ID;
const REPORTS_SECRET_KEY = import.meta.env.R2_REPORTS_SECRET_ACCESS_KEY;

// Public base URL — use custom domain if configured, otherwise raw R2 endpoint
const REPORTS_PUBLIC_URL =
  import.meta.env.R2_REPORTS_PUBLIC_URL ||
  `${REPORTS_ENDPOINT}/${REPORTS_BUCKET}`;

const s3 = new S3Client({
  region: "auto",
  endpoint: REPORTS_ENDPOINT,
  credentials: {
    accessKeyId: REPORTS_ACCESS_KEY!,
    secretAccessKey: REPORTS_SECRET_KEY!,
  },
  forcePathStyle: true,
});

/**
 * Upload a buffer to the reports R2 bucket and return the public URL.
 * Falls back to empty string if R2 credentials aren't configured.
 */
export async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType = "application/pdf"
): Promise<string> {
  if (!REPORTS_ACCESS_KEY || !REPORTS_SECRET_KEY) {
    console.warn("[R2:reports] Credentials not configured — skipping upload");
    return "";
  }

  const key = `${REPORTS_FOLDER}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: REPORTS_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentDisposition: `attachment; filename="${filename}"`,
    CacheControl: "public, max-age=31536000",
  });

  try {
    await s3.send(command);
    const url = `${REPORTS_PUBLIC_URL}/${encodeURIComponent(REPORTS_FOLDER)}/${encodeURIComponent(filename)}`;
    console.log(`[R2:reports] Uploaded: ${key} → ${url}`);
    return url;
  } catch (err) {
    console.error("[R2:reports] Upload failed:", err);
    return "";
  }
}
