import type { APIRoute } from "astro";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import AuditReportPDF from "@/components/proposal/AuditReportPDF";
import { uploadToR2 } from "@/lib/r2/upload";

// ── Concurrency guard: @react-pdf/renderer is CPU/memory heavy ──
// Limit concurrent PDF generations to 2. Additional requests get 503
// so they can retry instead of OOMing the process.
let activeGenerations = 0;
const MAX_CONCURRENT = 2;
const GENERATION_TIMEOUT_MS = 30_000;
const RETRY_AFTER_S = 5;

function safeFilename(company: string): string {
  const base = (company || "report")
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "report";
  const date = new Date().toISOString().slice(0, 10);
  return `madavi-ai-audit-${base}-${date}.pdf`;
}

export const POST: APIRoute = async ({ request }) => {
  // Concurrency gate — reject early if too many PDFs are being generated
  if (activeGenerations >= MAX_CONCURRENT) {
    return new Response(
      JSON.stringify({
        error: "Server busy — too many PDF generations in progress",
        retryAfter: RETRY_AFTER_S,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(RETRY_AFTER_S),
        },
      }
    );
  }

  activeGenerations++;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  try {
    const data = await request.json();

    // Timeout guard — @react-pdf can hang on malformed input
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        reject(new Error("PDF generation timed out"));
      }, GENERATION_TIMEOUT_MS);
    });

    const pdfBuffer = await Promise.race([
      renderToBuffer(React.createElement(AuditReportPDF, { data })),
      timeoutPromise,
    ]);

    // renderToBuffer won the race — cancel the timeout
    clearTimeout(timeoutId);

    // Upload to R2 for persistent storage
    const filename = safeFilename(data.companyName || "report");
    const r2Url = await uploadToR2(Buffer.from(pdfBuffer), filename);

    // Return PDF download with R2 URL in header
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
        "X-R2-URL": r2Url || "",
        "Access-Control-Expose-Headers": "X-R2-URL",
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to generate PDF report",
        detail: err?.message ?? String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    clearTimeout(timeoutId);
    if (!timedOut) {
      activeGenerations--;
    }
    // On timeout: slot stays occupied. The orphaned renderToBuffer is still
    // consuming CPU/memory in the background — the process must be restarted
    // to reclaim it. Capping at MAX_CONCURRENT=2 limits the blast radius.
  }
};
