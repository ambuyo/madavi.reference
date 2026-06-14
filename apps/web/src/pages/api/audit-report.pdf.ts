import type { APIRoute } from "astro";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import AuditReportPDF from "@/components/proposal/AuditReportPDF";
import { uploadToR2 } from "@/lib/r2/upload";

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
  try {
    const data = await request.json();

    const pdfBuffer = await renderToBuffer(
      React.createElement(AuditReportPDF, { data })
    );

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
        "X-R2-URL": r2Url || "",               // frontend reads this for the persistent link
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
  }
};
