import type { APIRoute } from "astro";
import { verifyTurnstile } from "@/lib/turnstile";

// ─── Scoring (mirrors ProposalForm.tsx) ───────────────────────────────────────

function score(map: Record<string, number>, val: string) { return map[val] ?? 0; }

function calculateScore(f: any): number {
  let t = 0;
  t += score({ "Not started": 0, "Exploring": 5, "Piloting": 10, "Scaling": 15, "Optimizing": 20 }, f.aiAdoptionStage);
  t += score({ "$0": 0, "Less than $500": 5, "$500–$2K": 10, "$2K–$10K": 15, "$10K+": 20 }, f.monthlyAISpend);
  t += score({ "Full dedicated team": 15, "Part-time resources": 10, "Planning to hire": 5, "No team": 0 }, f.dedicatedAITeam);
  t += score({ "Efficiency & cost reduction": 10, "Revenue growth": 15, "Customer experience": 10, "Competitive advantage": 15 }, f.primaryAIGoal);
  t += score({ "Exploring (6–12+ months)": 5, "Planning (3–6 months)": 10, "Ready now (0–3 months)": 20 }, f.implementationTimeline);
  t += score({ "Decision-maker": 20, "Key influencer": 15, "Researcher/evaluator": 5, "Other": 0 }, f.decisionAuthority);
  t += score({ "Not yet determined": 0, "Under $25K": 5, "$25K–$100K": 10, "$100K–$500K": 15, "$500K+": 20 }, f.annualAIBudget);
  t += (f.teamChangeReadiness ?? 3) * 2;
  t += (f.teamAILiteracy ?? 3) * 3;
  t += score({ "Strong champion": 15, "Supportive": 10, "Neutral": 5, "Skeptical": 0 }, f.leadershipBuyIn);
  t += score({ "Clean and accessible": 20, "Exists, needs cleaning": 15, "Scattered/siloed": 10, "Limited infrastructure": 0 }, f.dataAvailability);
  t += score({ "Formal policies in place": 15, "Basic policies": 10, "Informal only": 5, "No framework": 0 }, f.dataGovernance);
  t += (f.dataAccessibility ?? 3) * 2;
  t += score({ "Cloud-native, API-enabled": 20, "Mix of cloud/on-premise": 15, "Primarily on-premise": 10, "Legacy systems": 0 }, f.itInfrastructure);
  t += score({ "Strong team with AI experience": 15, "Capable team, learning AI": 10, "Basic IT, no AI expertise": 0 }, f.technicalTalent);
  t += score({ "APIs well-established": 15, "Some integration capability": 10, "Manual processes": 5, "Siloed systems": 0 }, f.integrationCapability);
  t += score({ "Enterprise-grade framework": 10, "Standard practices": 7, "Basic measures": 4, "Ad-hoc approach": 0 }, f.securityCompliance);
  t += score({ "Clear KPIs defined and tracked": 20, "KPIs identified, not tracked": 15, "General goals only": 5, "No measurement defined": 0 }, f.successMeasurementClarity);
  t += score({ "Track current performance": 15, "Some baseline exists": 10, "Limited baseline": 5, "No baseline": 0 }, f.baselineMeasurement);
  t += score({ "0–6 months": 15, "6–12 months": 10, "12–24 months": 5, "Beyond 24 months": 0 }, f.roiExpectation);
  t += score({ "Formal governance established": 20, "In development": 15, "Informal oversight": 10, "No framework": 0 }, f.aiGovernanceFramework);
  t += score({ "Heavily regulated, critical compliance needs": 10, "Moderate requirements": 7, "Light requirements": 4 }, f.complianceRequirements);
  t += score({ "Willing to pilot and iterate": 15, "Cautious, need proven solutions": 10, "Risk-averse, need guarantees": 0 }, f.riskAppetite);
  return t;
}

function getReadiness(raw: number) {
  const pct = Math.round((raw / 470) * 100);
  if (pct >= 90) return { pct, level: "AI-Ready Leader",   desc: "Scale mode — ready for enterprise-wide deployment" };
  if (pct >= 75) return { pct, level: "Advanced Adopter",  desc: "Strong foundation, ready to expand pilots" };
  if (pct >= 60) return { pct, level: "Strategic Builder", desc: "Building capabilities systematically" };
  if (pct >= 40) return { pct, level: "Early Explorer",    desc: "Early-stage exploration" };
  return              { pct, level: "Getting Started",    desc: "Beginning the AI journey" };
}

// ─── Zoho helpers ─────────────────────────────────────────────────────────────

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

async function upsertContact(
  token: string,
  f: any,
  score: number,
  readiness: ReturnType<typeof getReadiness>
): Promise<string> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  const parts = ((f.fullName as string) || "Unknown").trim().split(/\s+/);
  const firstName = parts[0];
  const lastName  = parts.slice(1).join(" ") || "—";

  const res = await timedFetch(`https://www.zohoapis.${dc}/bigin/v2/Contacts`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        First_Name:              firstName,
        Last_Name:               lastName,
        Email:                   f.workEmail,
        Phone:                   f.phone ?? "",
        Title:                   f.jobTitle ?? "",
        Account_Name:            f.companyName ?? "",
        Description:             `Industry: ${f.industry ?? "—"} | Size: ${f.companySize ?? "—"}`,
        Lead_Source:             f.hearAboutUs ?? "",
        // Custom fields — all 18
        AI_Readiness_Score:      score,
        Readiness_Level:         readiness.level,
        AI_Adoption_Stage:       f.aiAdoptionStage ?? "",
        Decision_Authority:      f.decisionAuthority ?? "",
        Annual_AI_Budget:        f.annualAIBudget ?? "",
        Implementation_Timeline: f.implementationTimeline ?? "",
        Primary_AI_Goal:         f.primaryAIGoal ?? "",
        Monthly_AI_Spend:        f.monthlyAISpend ?? "",
        Dedicated_AI_Team:       f.dedicatedAITeam ?? "",
        Team_Change_Readiness:   f.teamChangeReadiness ?? 3,
        Team_AI_Literacy:        f.teamAILiteracy ?? 3,
        Leadership_Buy_In:       f.leadershipBuyIn ?? "",
        Data_Availability:       f.dataAvailability ?? "",
        IT_Infrastructure:       f.itInfrastructure ?? "",
        Risk_Appetite:           f.riskAppetite ?? "",
        Top_Challenges:          f.topChallenges ?? [],
        Interested_In:           f.interestedIn ?? [],
        Audit_Source:            "AI Audit Form",
      }],
      duplicate_check_fields: ["Email"],
    }),
  });

  const body = await res.json() as any;
  const record = body.data?.[0];
  // New contact created
  if (record?.details?.id) return record.details.id as string;
  // Existing contact (duplicate email) — return its id
  if (record?.code === "DUPLICATE_DATA") return record.details.duplicate_record.id as string;
  throw new Error(`Contact upsert failed: ${JSON.stringify(body)}`);
}

async function createDeal(
  token: string,
  contactId: string,
  f: any,
  readiness: ReturnType<typeof getReadiness>
): Promise<void> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";

  const res = await timedFetch(`https://www.zohoapis.${dc}/bigin/v2/Pipelines`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        Deal_Name:    `AI Audit — ${f.companyName || f.fullName || "Lead"} — ${readiness.level} (${readiness.pct}%)`,
        Stage:        "Qualification",
        Contact_Name: { id: contactId },
        Description:  `Readiness: ${readiness.pct}/100 | Budget: ${f.annualAIBudget ?? "—"} | Timeline: ${f.implementationTimeline ?? "—"}`,
      }],
    }),
  });
  const body = await res.json() as any;
  if (body.data?.[0]?.status !== "success") {
    throw new Error(`Deal creation failed: ${JSON.stringify(body)}`);
  }
}

async function createNote(token: string, contactId: string, title: string, content: string): Promise<void> {
  const dc = import.meta.env.ZOHO_DATACENTER ?? "com";
  await timedFetch(`https://www.zohoapis.${dc}/bigin/v2/Notes`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        Note_Title:   title,
        Note_Content: content,
        Parent_Id:    contactId,
        $se_module:   "Contacts",
      }],
    }),
  });
}

// ─── Note content ─────────────────────────────────────────────────────────────

function buildNoteContent(f: any, raw: number, readiness: ReturnType<typeof getReadiness>): string {
  return `
READINESS SCORE: ${readiness.pct}/100 — ${readiness.level}
Raw Points: ${raw}/470
${readiness.desc}

--- CONTACT ---
Name:     ${f.fullName}
Email:    ${f.workEmail}
Phone:    ${f.phone || "—"}
Title:    ${f.jobTitle}
Company:  ${f.companyName}
Industry: ${f.industry}
Size:     ${f.companySize}

--- AI MATURITY ---
Adoption Stage:  ${f.aiAdoptionStage}
Tools In Use:    ${(f.aiToolsInUse ?? []).join(", ") || "—"}
Monthly Spend:   ${f.monthlyAISpend}
Dedicated Team:  ${f.dedicatedAITeam}

--- STRATEGIC CONTEXT ---
Primary Goal:    ${f.primaryAIGoal}
Timeline:        ${f.implementationTimeline}
Authority:       ${f.decisionAuthority}
Annual Budget:   ${f.annualAIBudget}

--- HCAIF READINESS ---
Change Readiness:  ${f.teamChangeReadiness}/5
AI Literacy:       ${f.teamAILiteracy}/5
Leadership Buy-in: ${f.leadershipBuyIn}
Ethical Concerns:  ${(f.ethicalConcerns ?? []).join(", ") || "None"}

--- PAIN POINTS ---
Top Challenges:  ${(f.topChallenges ?? []).join(", ") || "—"}
Immediate Help:  ${f.immediateHelp || "—"}
Heard About Us:  ${f.hearAboutUs}

--- ENGAGEMENT ---
Newsletter:    ${f.subscribeNewsletter ? "Yes" : "No"}
Interested In: ${(f.interestedIn ?? []).join(", ") || "—"}

--- DATA INFRASTRUCTURE ---
Data Availability:  ${f.dataAvailability}
Data Governance:    ${f.dataGovernance}
Data Challenges:    ${(f.dataChallenges ?? []).join(", ") || "—"}
Data Accessibility: ${f.dataAccessibility}/5

--- TECHNICAL CAPABILITIES ---
IT Infrastructure: ${f.itInfrastructure}
Technical Talent:  ${f.technicalTalent}
Integration:       ${f.integrationCapability}
Security Posture:  ${f.securityCompliance}

--- SUCCESS METRICS ---
Measurement Clarity: ${f.successMeasurementClarity}
Metrics to Track:    ${(f.metricsToTrack ?? []).join(", ") || "—"}
Baseline:            ${f.baselineMeasurement}
ROI Timeline:        ${f.roiExpectation}

--- RISK & GOVERNANCE ---
AI Governance:       ${f.aiGovernanceFramework}
Risk Concerns:       ${(f.riskMitigationConcerns ?? []).join(", ") || "—"}
Compliance Needs:    ${f.complianceRequirements}
Risk Appetite:       ${f.riskAppetite}
  `.trim();
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { turnstileToken, ...form } = body;

    // Validate required contact fields — skipped in dev for testing
    if (!import.meta.env.DEV && (!form.fullName || !form.workEmail || !form.companyName)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Turnstile verification — skipped in dev, re-enable before production
    if (!import.meta.env.DEV) {
      const ip = request.headers.get("CF-Connecting-IP") ?? undefined;
      const turnstileOk = await verifyTurnstile(turnstileToken ?? "", ip);
      if (!turnstileOk) {
        return new Response(
          JSON.stringify({ error: "Bot verification failed", message: "Please complete the security check and try again." }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Score
    const raw = calculateScore(form);
    const readiness = getReadiness(raw);

    // Submit to Zoho Bigin
    const zohoToken   = await getZohoToken();
    const contactId   = await upsertContact(zohoToken, form, raw, readiness);
    const noteTitle   = `AI Readiness Assessment — ${readiness.level} (${readiness.pct}%)`;
    const noteContent = buildNoteContent(form, raw, readiness);
    await createNote(zohoToken, contactId, noteTitle, noteContent);

    return new Response(
      JSON.stringify({ success: true, score: readiness }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Proposal submission error:", err);
    return new Response(
      JSON.stringify({ error: "Submission failed. Please try again.", detail: err?.message ?? String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
