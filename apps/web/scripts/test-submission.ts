/**
 * Test script — submits a sample AI audit form to the local API
 * Run: tsx scripts/test-submission.ts
 */

const API_URL = "http://localhost:4321/api/proposal.json";

const sample = {
  // Contact
  fullName:    "Amara Osei",
  workEmail:   "amara.osei@horizonretail.co.ke",
  companyName: "Horizon Retail Kenya",
  jobTitle:    "Chief Digital Officer",
  industry:    "Retail & E-commerce",
  companySize: "51–200",
  phone:       "+254712000099",

  // AI Adoption
  aiAdoptionStage:  "Piloting",
  aiToolsInUse:     ["ChatGPT / LLMs", "Microsoft Copilot", "Custom ML models"],
  monthlyAISpend:   "$2K–$10K",
  dedicatedAITeam:  "Part-time resources",

  // AI Goals
  primaryAIGoal:          "Customer experience",
  implementationTimeline: "Planning (3–6 months)",
  decisionAuthority:      "Decision-maker",
  annualAIBudget:         "$25K–$100K",

  // Team
  teamChangeReadiness: 4,
  teamAILiteracy:      3,
  leadershipBuyIn:     "Supportive",
  ethicalConcerns:     ["Data privacy", "Job displacement"],

  // Challenges
  topChallenges: ["Data quality issues", "Budget constraints", "Unclear ROI"],
  immediateHelp: "We are piloting AI-driven personalisation for our e-commerce platform but struggling with data quality and measuring ROI. Need a structured roadmap and vendor guidance.",
  hearAboutUs:   "LinkedIn",
  interestedIn:  ["Personalized AI roadmap", "AI implementation support", "Custom AI workshop"],

  // Data
  dataAvailability:  "Exists, needs cleaning",
  dataGovernance:    "Basic policies",
  dataChallenges:    ["Data quality issues", "Lack of data literacy"],
  dataAccessibility: 3,

  // Tech
  itInfrastructure:      "Mix of cloud/on-premise",
  technicalTalent:       "Capable team, learning AI",
  integrationCapability: "Some integration capability",
  securityCompliance:    "Standard practices",

  // Metrics
  successMeasurementClarity: "KPIs identified, not tracked",
  metricsToTrack:            ["Customer satisfaction", "Conversion rate", "Cost savings"],
  baselineMeasurement:       "Some baseline exists",
  roiExpectation:            "6–12 months",

  // Governance
  aiGovernanceFramework:  "In development",
  riskMitigationConcerns: ["Data privacy", "Model accuracy"],
  complianceRequirements: "Moderate requirements",
  riskAppetite:           "Cautious, need proven solutions",

  // Newsletter
  subscribeNewsletter: true,

  // Turnstile disabled for testing
  turnstileToken: null,
};

async function main() {
  console.log("🚀  Submitting test form to", API_URL, "\n");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sample),
  });

  const data = await res.json() as any;

  if (res.ok) {
    console.log("✅  Submission successful!\n");
    console.log(`   Score:  ${data.score?.pct}/100`);
    console.log(`   Level:  ${data.score?.level}`);
    console.log(`   Desc:   ${data.score?.desc}`);
  } else {
    console.error("❌  Submission failed:", res.status);
    console.error(JSON.stringify(data, null, 2));
  }
}

main().catch(e => {
  console.error("❌  Error:", e.message);
  process.exit(1);
});
