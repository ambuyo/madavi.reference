import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Circle,
  Path,
  Image,
} from "@react-pdf/renderer";

// ── Register Fonts ──────────────────────────────────────────────────────────

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyfMZhrib2Bg-4.ttf",
      fontWeight: 900,
    },
  ],
});

// ── Branding ─────────────────────────────────────────────────────────────────

const BRAND = "#005B65";
const GRAY = "#9CA3AF";
const LOGO_URL = "https://images.madavi.co/Madavi%20Astro%202026/Branding/Madavi%20Main%20Logo.png";

// ── Scoring ─────────────────────────────────────────────────────────────────

function score(map: Record<string, number>, val: string) { return map[val] ?? 0; }

function calculateScore(f: any): { raw: number; pct: number; level: string; desc: string; color: string } {
  let t = 0;
  t += score({ "Not started": 0, Exploring: 5, Piloting: 10, Scaling: 15, Optimizing: 20 }, f.aiAdoptionStage);
  t += score({ "$0": 0, "Less than $500": 5, "$500–$2K": 10, "$2K–$10K": 15, "$10K+": 20 }, f.monthlyAISpend);
  t += score({ "Full dedicated team": 15, "Part-time resources": 10, "Planning to hire": 5, "No team": 0 }, f.dedicatedAITeam);
  t += score({ "Efficiency & cost reduction": 10, "Revenue growth": 15, "Customer experience": 10, "Competitive advantage": 15 }, f.primaryAIGoal);
  t += score({ "Exploring (6–12+ months)": 5, "Planning (3–6 months)": 10, "Ready now (0–3 months)": 20 }, f.implementationTimeline);
  t += score({ "Decision-maker": 20, "Key influencer": 15, "Researcher/evaluator": 5, Other: 0 }, f.decisionAuthority);
  t += score({ "Not yet determined": 0, "Under $25K": 5, "$25K–$100K": 10, "$100K–$500K": 15, "$500K+": 20 }, f.annualAIBudget);
  t += (f.teamChangeReadiness ?? 3) * 2;
  t += (f.teamAILiteracy ?? 3) * 3;
  t += score({ "Strong champion": 15, Supportive: 10, Neutral: 5, Skeptical: 0 }, f.leadershipBuyIn);
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
  const pct = Math.round((t / 470) * 100);
  let level: string, desc: string, color: string;
  if (pct >= 90) { level = "AI-Ready Leader"; desc = "Scale mode — ready for enterprise-wide deployment."; color = "#005B65"; }
  else if (pct >= 75) { level = "Advanced Adopter"; desc = "Strong foundation — ready to expand from pilot to scale."; color = "#1EB49C"; }
  else if (pct >= 60) { level = "Strategic Builder"; desc = "Building capabilities systematically toward your first pilot."; color = "#F59E0B"; }
  else if (pct >= 40) { level = "Early Explorer"; desc = "Early-stage exploration — foundation work comes first."; color = "#F97316"; }
  else { level = "Getting Started"; desc = "Education and planning are the right next steps."; color = "#EF4444"; }
  return { raw: t, pct, level, desc, color };
}

type Dimension = { label: string; pct: number; color: string; maxScore: number; raw: number };

// ── 6 Dimension scores ──────────────────────────────────────────────────────

function dimensions(f: any): Dimension[] {
  const c = (val: number, max: number) => Math.round((val / max) * 100);
  const d = (label: string, raw: number, max: number) => ({
    label, raw, maxScore: max,
    pct: Math.min(100, c(raw, max)),
    color: c(raw, max) >= 75 ? "#1EB49C" : c(raw, max) >= 50 ? "#F59E0B" : c(raw, max) >= 25 ? "#F97316" : "#EF4444",
  });

  const adoptionRaw = score({ "Not started": 0, Exploring: 5, Piloting: 10, Scaling: 15, Optimizing: 20 }, f.aiAdoptionStage)
    + score({ "$0": 0, "Less than $500": 5, "$500–$2K": 10, "$2K–$10K": 15, "$10K+": 20 }, f.monthlyAISpend)
    + score({ "Full dedicated team": 15, "Part-time resources": 10, "Planning to hire": 5, "No team": 0 }, f.dedicatedAITeam);

  const strategyRaw = score({ "Efficiency & cost reduction": 10, "Revenue growth": 15, "Customer experience": 10, "Competitive advantage": 15 }, f.primaryAIGoal)
    + score({ "Exploring (6–12+ months)": 5, "Planning (3–6 months)": 10, "Ready now (0–3 months)": 20 }, f.implementationTimeline)
    + score({ "Decision-maker": 20, "Key influencer": 15, "Researcher/evaluator": 5, Other: 0 }, f.decisionAuthority)
    + score({ "Not yet determined": 0, "Under $25K": 5, "$25K–$100K": 10, "$100K–$500K": 15, "$500K+": 20 }, f.annualAIBudget);

  const teamRaw = (f.teamChangeReadiness ?? 3) * 2 + (f.teamAILiteracy ?? 3) * 3
    + score({ "Strong champion": 15, Supportive: 10, Neutral: 5, Skeptical: 0 }, f.leadershipBuyIn);

  const dataRaw = score({ "Clean and accessible": 20, "Exists, needs cleaning": 15, "Scattered/siloed": 10, "Limited infrastructure": 0 }, f.dataAvailability)
    + score({ "Formal policies in place": 15, "Basic policies": 10, "Informal only": 5, "No framework": 0 }, f.dataGovernance)
    + ((f.dataAccessibility ?? 3) * 2);

  const techRaw = score({ "Cloud-native, API-enabled": 20, "Mix of cloud/on-premise": 15, "Primarily on-premise": 10, "Legacy systems": 0 }, f.itInfrastructure)
    + score({ "Strong team with AI experience": 15, "Capable team, learning AI": 10, "Basic IT, no AI expertise": 0 }, f.technicalTalent)
    + score({ "APIs well-established": 15, "Some integration capability": 10, "Manual processes": 5, "Siloed systems": 0 }, f.integrationCapability)
    + score({ "Enterprise-grade framework": 10, "Standard practices": 7, "Basic measures": 4, "Ad-hoc approach": 0 }, f.securityCompliance);

  const govRaw = score({ "Clear KPIs defined and tracked": 20, "KPIs identified, not tracked": 15, "General goals only": 5, "No measurement defined": 0 }, f.successMeasurementClarity)
    + score({ "Track current performance": 15, "Some baseline exists": 10, "Limited baseline": 5, "No baseline": 0 }, f.baselineMeasurement)
    + score({ "0–6 months": 15, "6–12 months": 10, "12–24 months": 5, "Beyond 24 months": 0 }, f.roiExpectation)
    + score({ "Formal governance established": 20, "In development": 15, "Informal oversight": 10, "No framework": 0 }, f.aiGovernanceFramework)
    + score({ "Heavily regulated, critical compliance needs": 10, "Moderate requirements": 7, "Light requirements": 4 }, f.complianceRequirements)
    + score({ "Willing to pilot and iterate": 15, "Cautious, need proven solutions": 10, "Risk-averse, need guarantees": 0 }, f.riskAppetite);

  return [
    d("AI\nAdoption", adoptionRaw, 55),
    d("Strategy &\nBudget", strategyRaw, 75),
    d("Team\nReadiness", teamRaw, 45),
    d("Data\nFoundation", dataRaw, 40),
    d("Technical\nInfrastructure", techRaw, 65),
    d("Governance\n& Metrics", govRaw, 80),
  ];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: any): string => Array.isArray(v) ? (v.length ? v.join(", ") : "—") : (v ?? "—");

// ── SVG Arc helper ───────────────────────────────────────────────────────────

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

// ── Radar / Spider Chart ─────────────────────────────────────────────────────

function RadarChart({ dims, size = 220 }: { dims: Dimension[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const levels = 5; // concentric rings

  const hexPoints = dims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / dims.length - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), angle };
  });

  return (
    <Svg width={size} height={size}>
      {/* Grid rings */}
      {Array.from({ length: levels }).map((_, li) => {
        const r = radius * ((li + 1) / levels);
        return <Circle key={li} cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth={0.5} />;
      })}

      {/* Axis lines */}
      {hexPoints.map((p, i) => (
        <Path key={i} d={`M ${cx} ${cy} L ${p.x} ${p.y}`} stroke="#E5E7EB" strokeWidth={0.5} />
      ))}

      {/* Data polygon */}
      <Path
        d={hexPoints
          .map((p, i) => {
            const r = radius * (dims[i].pct / 100);
            const x = cx + r * Math.cos(p.angle);
            const y = cy + r * Math.sin(p.angle);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ") + " Z"}
        fill={BRAND}
        fillOpacity={0.15}
        stroke={BRAND}
        strokeWidth={1.5}
      />

      {/* Data points */}
      {hexPoints.map((p, i) => {
        const r = radius * (dims[i].pct / 100);
        const x = cx + r * Math.cos(p.angle);
        const y = cy + r * Math.sin(p.angle);
        return <Circle key={i} cx={x} cy={y} r={3} fill={dims[i].color} />;
      })}
    </Svg>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
        <Text style={{ fontSize: 8, color: "#374151", fontWeight: 700 }}>{label}</Text>
        <Text style={{ fontSize: 8, color, fontWeight: 900 }}>{pct}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: "#F3F4F6", borderRadius: 3 }}>
        <View style={{ height: 6, backgroundColor: color, borderRadius: 3, width: `${pct}%` }} />
      </View>
    </View>
  );
}

// ── Section Row ──────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 3, gap: 4 }}>
      <Text style={{ width: "38%", fontSize: 8, fontWeight: 700, color: "#374151" }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 8, color: "#6B7280" }}>{value}</Text>
    </View>
  );
}

// ── Section Card ─────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12, padding: 12, backgroundColor: "#FAFAFA", borderRadius: 6, border: "0.5 solid #E5E7EB" }}>
      <Text style={{ fontSize: 10, fontWeight: 900, color: BRAND, marginBottom: 8, textTransform: "uppercase" }}>{title}</Text>
      {children}
    </View>
  );
}

// ── Insights ─────────────────────────────────────────────────────────────────

function generateInsights(f: any, r: ReturnType<typeof calculateScore>): string[] {
  const insights: string[] = [];
  if (f.aiAdoptionStage === "Not started" || f.aiAdoptionStage === "Exploring") {
    insights.push("Start with a focused AI pilot program to build internal momentum and demonstrate tangible value before scaling. Identify one high-impact, low-complexity use case.");
  }
  if (f.aiAdoptionStage === "Piloting") {
    insights.push("Standardize your AI evaluation framework and build a repeatable playbook for scaling successful pilots across departments. Document what is working.");
  }
  if ((f.aiAdoptionStage === "Scaling" || f.aiAdoptionStage === "Optimizing") && (f.dataChallenges ?? []).length > 0) {
    insights.push("As you scale AI, data quality becomes a bottleneck. Invest in automated data validation, governance standards, and breaking down remaining data silos now.");
  }
  if ((f.dataAvailability === "Scattered/siloed" || f.dataAvailability === "Exists, needs cleaning") && (f.topChallenges ?? []).some((c: string) => c.toLowerCase().includes("data"))) {
    insights.push("Data readiness is your key bottleneck. Before deploying advanced AI, invest in data cleaning and governance to create a unified, reliable data foundation.");
  }
  if (f.leadershipBuyIn === "Strong champion" && f.teamAILiteracy <= 3) {
    insights.push("Leadership support is strong, but team AI literacy needs development. A structured AI fluency program will accelerate adoption and reduce resistance.");
  }
  if ((f.itInfrastructure === "Legacy systems" || f.itInfrastructure === "Primarily on-premise") && r.pct < 60) {
    insights.push("Your infrastructure may limit AI scalability. Consider a phased cloud migration or hybrid architecture to enable API-driven AI integration.");
  }
  if (f.annualAIBudget === "Not yet determined" || f.annualAIBudget === "Under $25K") {
    insights.push("Define a clear AI investment roadmap with phased milestones tied to expected ROI. Start with low-cost, high-impact use cases to build the business case.");
  }
  if ((f.riskMitigationConcerns ?? []).some((c: string) => c.toLowerCase().includes("privacy") || c.toLowerCase().includes("compliance") || c.toLowerCase().includes("regulat"))) {
    insights.push("With regulatory concerns flagged, establish an AI governance board and data ethics framework before deploying customer-facing AI solutions.");
  }
  if (r.pct < 50) {
    insights.push("Foundational gaps should be addressed before significant AI investment. A structured 3–6 month readiness program will build the capabilities needed for successful AI adoption.");
  }
  if (insights.length < 3) {
    insights.push("Your organization shows strong AI readiness. Focus on accelerating pilots, measuring ROI rigorously, and building your AI talent pipeline to maintain momentum.");
    insights.push("Consider advanced AI governance practices and ethical AI frameworks to stay ahead of regulatory requirements as AI adoption scales.");
  }
  return insights.slice(0, 5);
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: { fontFamily: "Inter", padding: 36, paddingBottom: 56, fontSize: 8, color: "#1F2937", lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: GRAY, borderTop: "0.5 solid #E5E7EB", paddingTop: 6 },
});

// ── Cover Page ───────────────────────────────────────────────────────────────

function CoverPage({ data, r, dims, today }: { data: any; r: ReturnType<typeof calculateScore>; dims: Dimension[]; today: string }) {
  return (
    <Page size="A4" style={styles.page}>
      {/* Brand header with logo */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <Image src={LOGO_URL} style={{ height: 32, width: 100 }} />
        <Text style={{ fontSize: 8, color: GRAY }}>{today}</Text>
      </View>

      {/* Hero Score + Radar side by side */}
      <View style={{ flexDirection: "row", gap: 16, marginBottom: 24 }}>
        {/* Left: Score */}
        <View style={{ flex: 1, alignItems: "center", paddingVertical: 20, backgroundColor: "#F0FDFA", borderRadius: 12 }}>
          <Text style={{ fontSize: 9, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>AI Readiness Score</Text>
          <View style={{ position: "relative", alignItems: "center", justifyContent: "center", width: 110, height: 110 }}>
            <Svg width={110} height={110}>
              <Circle cx={55} cy={55} r={44} fill="none" stroke="#E5E7EB" strokeWidth={6} />
              <Path
                d={describeArc(55, 55, 44, 180, 180 + (r.pct / 100) * 360)}
                stroke={r.color}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>
            <View style={{ position: "absolute", alignItems: "center" }}>
              <Text style={{ fontSize: 32, fontWeight: 900, color: r.color }}>{r.pct}</Text>
              <Text style={{ fontSize: 7, color: GRAY }}>out of 100</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, fontWeight: 900, color: r.color, marginTop: 8 }}>{r.level}</Text>
          <Text style={{ fontSize: 8, color: "#6B7280", marginTop: 2, textAlign: "center", paddingHorizontal: 16 }}>{r.desc}</Text>
        </View>

        {/* Right: Radar Chart */}
        <View style={{ flex: 1, alignItems: "center", paddingVertical: 12, backgroundColor: "#FAFAFA", borderRadius: 12 }}>
          <Text style={{ fontSize: 8, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Dimension Analysis</Text>
          <RadarChart dims={dims} size={210} />
          {/* Legend */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6, paddingHorizontal: 8 }}>
            {dims.map((d, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: d.color }} />
                <Text style={{ fontSize: 6, color: "#6B7280" }}>{d.label.replace("\n", " ")} {d.pct}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Recipient Info */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        <View style={{ flex: 1, padding: 14, backgroundColor: "#FAFAFA", borderRadius: 8 }}>
          <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Prepared for</Text>
          <Text style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{data.fullName || "—"}</Text>
          <Text style={{ fontSize: 9, color: "#6B7280", marginTop: 2 }}>{data.companyName || "—"}</Text>
          <Text style={{ fontSize: 8, color: GRAY, marginTop: 2 }}>{data.jobTitle || ""}{data.industry ? ` · ${data.industry}` : ""}</Text>
        </View>
        <View style={{ flex: 1, padding: 14, backgroundColor: "#FAFAFA", borderRadius: 8 }}>
          <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Report Details</Text>
          <Row label="Date" value={today} />
          <Row label="Company Size" value={data.companySize || "—"} />
          <Row label="Heard About Us" value={data.hearAboutUs || "—"} />
          <Row label="Email" value={data.workEmail || "—"} />
        </View>
      </View>

      {/* Dimension progress bars below */}
      <Text style={{ fontSize: 9, fontWeight: 900, color: BRAND, textTransform: "uppercase", marginBottom: 10 }}>Dimension Scores</Text>
      {dims.map((s, i) => (
        <ProgressBar key={i} label={s.label.replace("\n", " ")} pct={s.pct} color={s.color} />
      ))}

      <Text style={styles.footer}>@madavihq  ·  www.madavi.co  ·  Confidential</Text>
    </Page>
  );
}

// ── Detail Pages ─────────────────────────────────────────────────────────────

function DetailPages({ data, r, dims, today }: { data: any; r: ReturnType<typeof calculateScore>; dims: Dimension[]; today: string }) {
  const insights = generateInsights(data, r);
  return (
    <>
      {/* Page 2: Insights + detailed data */}
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 6, borderBottom: `1.5 solid ${BRAND}` }}>
          <Image src={LOGO_URL} style={{ height: 22, width: 70 }} />
          <Text style={{ fontSize: 8, color: GRAY }}>AI Readiness Report · {today}</Text>
        </View>

        <Text style={{ fontSize: 11, fontWeight: 900, color: "#111827", marginBottom: 10 }}>Strategic Insights</Text>
        {insights.map((insight, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 8, padding: 10, backgroundColor: "#F0FDFA", borderRadius: 6, borderLeft: `3 solid ${r.color}` }}>
            <Text style={{ fontSize: 12, color: r.color, fontWeight: 900, width: 18 }}>{i + 1}</Text>
            <Text style={{ flex: 1, fontSize: 8, color: "#374151", lineHeight: 1.5 }}>{insight}</Text>
          </View>
        ))}

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Card title="AI Adoption">
              <Row label="Adoption Stage" value={data.aiAdoptionStage || "—"} />
              <Row label="Tools In Use" value={fmt(data.aiToolsInUse)} />
              <Row label="Monthly AI Spend" value={data.monthlyAISpend || "—"} />
              <Row label="Dedicated AI Team" value={data.dedicatedAITeam || "—"} />
            </Card>
            <Card title="Team Readiness">
              <Row label="Change Readiness" value={`${data.teamChangeReadiness ?? "—"}/5`} />
              <Row label="AI Literacy" value={`${data.teamAILiteracy ?? "—"}/5`} />
              <Row label="Leadership Buy-In" value={data.leadershipBuyIn || "—"} />
              <Row label="Ethical Concerns" value={fmt(data.ethicalConcerns)} />
              <Row label="Top Challenges" value={fmt(data.topChallenges)} />
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card title="Strategy & Budget">
              <Row label="Primary AI Goal" value={data.primaryAIGoal || "—"} />
              <Row label="Implementation Timeline" value={data.implementationTimeline || "—"} />
              <Row label="Decision Authority" value={data.decisionAuthority || "—"} />
              <Row label="Annual AI Budget" value={data.annualAIBudget || "—"} />
            </Card>
            <Card title="Data Foundation">
              <Row label="Availability" value={data.dataAvailability || "—"} />
              <Row label="Governance" value={data.dataGovernance || "—"} />
              <Row label="Challenges" value={fmt(data.dataChallenges)} />
              <Row label="Accessibility" value={`${data.dataAccessibility ?? "—"}/5`} />
            </Card>
          </View>
        </View>

        <Text style={styles.footer}>@madavihq  ·  www.madavi.co  ·  {data.companyName || ""}  ·  Confidential</Text>
      </Page>

      {/* Page 3: Tech + Governance + Summary */}
      <Page size="A4" style={styles.page}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 6, borderBottom: `1.5 solid ${BRAND}` }}>
          <Image src={LOGO_URL} style={{ height: 22, width: 70 }} />
          <Text style={{ fontSize: 8, color: GRAY }}>AI Readiness Report · {today}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Card title="Technical Infrastructure">
              <Row label="IT Infrastructure" value={data.itInfrastructure || "—"} />
              <Row label="Technical Talent" value={data.technicalTalent || "—"} />
              <Row label="Integration Capability" value={data.integrationCapability || "—"} />
              <Row label="Security Posture" value={data.securityCompliance || "—"} />
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card title="Governance & Risk">
              <Row label="AI Governance" value={data.aiGovernanceFramework || "—"} />
              <Row label="Risk Concerns" value={fmt(data.riskMitigationConcerns)} />
              <Row label="Compliance Needs" value={data.complianceRequirements || "—"} />
              <Row label="Risk Appetite" value={data.riskAppetite || "—"} />
            </Card>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Card title="Success Metrics">
              <Row label="Measurement Clarity" value={data.successMeasurementClarity || "—"} />
              <Row label="Metrics to Track" value={fmt(data.metricsToTrack)} />
              <Row label="Baseline" value={data.baselineMeasurement || "—"} />
              <Row label="ROI Expectation" value={data.roiExpectation || "—"} />
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card title="Engagement">
              <Row label="Immediate Help Needed" value={data.immediateHelp || "—"} />
              <Row label="Interested In" value={fmt(data.interestedIn)} />
              <Row label="Newsletter" value={data.subscribeNewsletter ? "Subscribed" : "Not subscribed"} />
              <Row label="Phone" value={data.phone || "—"} />
            </Card>
          </View>
        </View>

        {/* Summary */}
        <View style={{ marginTop: 8, padding: 14, backgroundColor: "#F0FDFA", borderRadius: 8, border: `1 solid ${BRAND}20` }}>
          <Text style={{ fontSize: 10, fontWeight: 900, color: BRAND, marginBottom: 6 }}>Summary & Next Steps</Text>
          <Text style={{ fontSize: 8, color: "#374151", lineHeight: 1.6 }}>
            {data.fullName || "The respondent"} at {data.companyName || "your organization"} scored {r.pct}/100 ({r.level}) on the Madavi AI Readiness Assessment.{"\n\n"}
            This report benchmarks your organization across 6 dimensions: AI Adoption, Strategy & Budget, Team Readiness, Data Foundation, Technical Infrastructure, and Governance & Metrics. The insights above identify priority areas for your AI journey.{"\n\n"}
            Madavi's Human-Centric AI Framework (HCAIF) addresses readiness gaps across strategy, culture, data, and infrastructure — ensuring your team is prepared before a single tool is deployed.{"\n\n"}
            Our team will reach out within 1 business day to schedule a personalized consultation call to discuss your results and recommend next steps.
          </Text>
        </View>

        {/* Score summary footer */}
        <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "center", gap: 20 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase" }}>AI Readiness</Text>
            <Text style={{ fontSize: 18, fontWeight: 900, color: r.color }}>{r.pct}/100</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase" }}>Level</Text>
            <Text style={{ fontSize: 11, fontWeight: 900, color: r.color }}>{r.level}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 7, color: GRAY, textTransform: "uppercase" }}>Max Dimension</Text>
            <Text style={{ fontSize: 11, fontWeight: 900, color: "#1EB49C" }}>
              {dims.reduce((best, d) => d.pct > best.pct ? d : best, dims[0]).label.replace("\n", " ")} ({dims.reduce((best, d) => d.pct > best.pct ? d : best, dims[0]).pct}%)
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>@madavihq  ·  www.madavi.co  ·  {data.companyName || ""}  ·  Confidential</Text>
      </Page>
    </>
  );
}

// ── Export ───────────────────────────────────────────────────────────────────

export default function AuditReportPDF({ data }: { data: any }) {
  const r = calculateScore(data);
  const dims = dimensions(data);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const company = data.companyName || "organisation";

  return (
    <Document
      title={`Madavi AI Readiness Report — ${company}`}
      author="Madavi Inc."
      subject={`AI Readiness Assessment: ${r.pct}/100 — ${r.level}`}
      creator="Madavi AI Audit"
      keywords={`AI readiness, ${r.level}, ${data.industry || "technology"}, ${company}`}
    >
      <CoverPage data={data} r={r} dims={dims} today={today} />
      <DetailPages data={data} r={r} dims={dims} today={today} />
    </Document>
  );
}
