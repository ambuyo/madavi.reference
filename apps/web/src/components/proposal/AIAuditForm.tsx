import { useState, useRef, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  // Section 1
  fullName: string; workEmail: string; companyName: string; jobTitle: string;
  industry: string; companySize: string; phone: string;
  // Section 2
  aiAdoptionStage: string; aiToolsInUse: string[]; monthlyAISpend: string; dedicatedAITeam: string;
  // Section 3
  primaryAIGoal: string; implementationTimeline: string; decisionAuthority: string; annualAIBudget: string;
  // Section 4
  teamChangeReadiness: number; teamAILiteracy: number; leadershipBuyIn: string; ethicalConcerns: string[];
  // Section 5
  topChallenges: string[]; immediateHelp: string; hearAboutUs: string;
  // Section 6
  subscribeNewsletter: boolean; interestedIn: string[];
  // Section 7
  dataAvailability: string; dataGovernance: string; dataChallenges: string[]; dataAccessibility: number;
  // Section 8
  itInfrastructure: string; technicalTalent: string; integrationCapability: string; securityCompliance: string;
  // Section 9
  successMeasurementClarity: string; metricsToTrack: string[]; baselineMeasurement: string; roiExpectation: string;
  // Section 10
  aiGovernanceFramework: string; riskMitigationConcerns: string[]; complianceRequirements: string; riskAppetite: string;
}

const INITIAL: FormState = {
  fullName: "", workEmail: "", companyName: "", jobTitle: "", industry: "", companySize: "", phone: "",
  aiAdoptionStage: "", aiToolsInUse: [], monthlyAISpend: "", dedicatedAITeam: "",
  primaryAIGoal: "", implementationTimeline: "", decisionAuthority: "", annualAIBudget: "",
  teamChangeReadiness: 3, teamAILiteracy: 3, leadershipBuyIn: "", ethicalConcerns: [],
  topChallenges: [], immediateHelp: "", hearAboutUs: "",
  subscribeNewsletter: true, interestedIn: [],
  dataAvailability: "", dataGovernance: "", dataChallenges: [], dataAccessibility: 3,
  itInfrastructure: "", technicalTalent: "", integrationCapability: "", securityCompliance: "",
  successMeasurementClarity: "", metricsToTrack: [], baselineMeasurement: "", roiExpectation: "",
  aiGovernanceFramework: "", riskMitigationConcerns: [], complianceRequirements: "", riskAppetite: "",
};

// ─── Scoring ──────────────────────────────────────────────────────────────────

function score(map: Record<string, number>, val: string) { return map[val] ?? 0; }

function calculateScore(f: FormState): number {
  let t = 0;
  t += score({ "Not started": 0, "Exploring": 5, "Piloting": 10, "Scaling": 15, "Optimizing": 20 }, f.aiAdoptionStage);
  t += score({ "$0": 0, "Less than $500": 5, "$500–$2K": 10, "$2K–$10K": 15, "$10K+": 20 }, f.monthlyAISpend);
  t += score({ "Full dedicated team": 15, "Part-time resources": 10, "Planning to hire": 5, "No team": 0 }, f.dedicatedAITeam);
  t += score({ "Efficiency & cost reduction": 10, "Revenue growth": 15, "Customer experience": 10, "Competitive advantage": 15 }, f.primaryAIGoal);
  t += score({ "Exploring (6–12+ months)": 5, "Planning (3–6 months)": 10, "Ready now (0–3 months)": 20 }, f.implementationTimeline);
  t += score({ "Decision-maker": 20, "Key influencer": 15, "Researcher/evaluator": 5, "Other": 0 }, f.decisionAuthority);
  t += score({ "Not yet determined": 0, "Under $25K": 5, "$25K–$100K": 10, "$100K–$500K": 15, "$500K+": 20 }, f.annualAIBudget);
  t += f.teamChangeReadiness * 2;
  t += f.teamAILiteracy * 3;
  t += score({ "Strong champion": 15, "Supportive": 10, "Neutral": 5, "Skeptical": 0 }, f.leadershipBuyIn);
  t += score({ "Clean and accessible": 20, "Exists, needs cleaning": 15, "Scattered/siloed": 10, "Limited infrastructure": 0 }, f.dataAvailability);
  t += score({ "Formal policies in place": 15, "Basic policies": 10, "Informal only": 5, "No framework": 0 }, f.dataGovernance);
  t += f.dataAccessibility * 2;
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
  if (pct >= 90) return { pct, level: "AI-Ready Leader",   desc: "Scale mode—ready for enterprise-wide deployment", color: "#005B65" };
  if (pct >= 75) return { pct, level: "Advanced Adopter",  desc: "Pilot → Scale—strong foundation, ready to expand", color: "#1EB49C" };
  if (pct >= 60) return { pct, level: "Strategic Builder", desc: "Foundation → Pilot—building capabilities systematically", color: "#F59E0B" };
  if (pct >= 40) return { pct, level: "Early Explorer",    desc: "Assessment → Foundation—early-stage exploration", color: "#F97316" };
  return              { pct, level: "Getting Started",    desc: "Education → Planning—beginning the AI journey", color: "#EF4444" };
}

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(s: number, f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (s === 0) {
    if (!f.fullName.trim())    e.fullName    = "Full name is required";
    if (!f.workEmail.trim())   e.workEmail   = "Work email is required";
    else if (!EMAIL_RE.test(f.workEmail)) e.workEmail = "Enter a valid email address";
    if (!f.companyName.trim()) e.companyName = "Company name is required";
    if (!f.jobTitle)           e.jobTitle    = "Please select your role";
    if (!f.industry)           e.industry    = "Please select your industry";
    if (!f.companySize)        e.companySize = "Please select company size";
  }
  if (s === 1) {
    if (!f.aiAdoptionStage) e.aiAdoptionStage = "Please select an option";
    if (!f.monthlyAISpend)  e.monthlyAISpend  = "Please select an option";
    if (!f.dedicatedAITeam) e.dedicatedAITeam = "Please select an option";
  }
  if (s === 2) {
    if (!f.primaryAIGoal)          e.primaryAIGoal          = "Please select an option";
    if (!f.implementationTimeline) e.implementationTimeline = "Please select an option";
    if (!f.decisionAuthority)      e.decisionAuthority      = "Please select an option";
    if (!f.annualAIBudget)         e.annualAIBudget         = "Please select an option";
  }
  if (s === 3) {
    if (!f.leadershipBuyIn) e.leadershipBuyIn = "Please select an option";
  }
  if (s === 4) {
    if (!f.hearAboutUs) e.hearAboutUs = "Please select a source";
  }
  if (s === 6) {
    if (!f.dataAvailability) e.dataAvailability = "Please select an option";
    if (!f.dataGovernance)   e.dataGovernance   = "Please select an option";
  }
  if (s === 7) {
    if (!f.itInfrastructure)      e.itInfrastructure      = "Please select an option";
    if (!f.technicalTalent)       e.technicalTalent       = "Please select an option";
    if (!f.integrationCapability) e.integrationCapability = "Please select an option";
    if (!f.securityCompliance)    e.securityCompliance    = "Please select an option";
  }
  if (s === 8) {
    if (!f.successMeasurementClarity) e.successMeasurementClarity = "Please select an option";
    if (!f.baselineMeasurement)       e.baselineMeasurement       = "Please select an option";
    if (!f.roiExpectation)            e.roiExpectation            = "Please select an option";
  }
  if (s === 9) {
    if (!f.aiGovernanceFramework)  e.aiGovernanceFramework  = "Please select an option";
    if (!f.complianceRequirements) e.complianceRequirements = "Please select an option";
    if (!f.riskAppetite)           e.riskAppetite           = "Please select an option";
  }
  return e;
}

// ─── Field components ─────────────────────────────────────────────────────────

const ERR = "#EF4444";

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p style={{ fontWeight: 600, fontSize: "14px", color: "#1B1B1B", marginBottom: "10px" }}>
      {children}{required && <span style={{ color: ERR }}> *</span>}
    </p>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p style={{ color: ERR, fontSize: "12px", marginTop: "6px" }}>{msg}</p>;
}

function TextInput({ placeholder, value, onChange, type = "text", required, error }: any) {
  return (
    <div>
      <input
        type={type} placeholder={placeholder} value={value} required={required}
        onChange={e => onChange(e.target.value)}
        style={{
          background: "#fff", border: `1.5px solid ${error ? ERR : "#E5E7EB"}`,
          borderRadius: "8px", padding: "12px 14px", color: "#1B1B1B", fontSize: "15px",
          width: "100%", fontFamily: "Inter, sans-serif", outline: "none",
        }}
      />
      <FieldError msg={error} />
    </div>
  );
}

function SelectInput({ value, onChange, options, placeholder, error }: any) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          background: "#fff", border: `1.5px solid ${error ? ERR : "#E5E7EB"}`,
          borderRadius: "8px", padding: "12px 40px 12px 14px",
          color: value ? "#1B1B1B" : "#9CA3AF", fontSize: "15px",
          width: "100%", fontFamily: "Inter, sans-serif", outline: "none", appearance: "none",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      {/* dropdown arrow */}
      <svg
        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        width="16" height="16" viewBox="0 0 16 16" fill="none"
      >
        <path d="M4 6l4 4 4-4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <FieldError msg={error} />
    </div>
  );
}

function RadioGroup({ options, value, onChange, error }: { options: { label: string; score?: number }[]; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {options.map(opt => {
          const sel = value === opt.label;
          return (
            <button key={opt.label} type="button" onClick={() => onChange(opt.label)}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                background: sel ? "#EEF6F7" : "#fff",
                border: `2px solid ${sel ? "#005B65" : error ? ERR : "#E5E7EB"}`,
                borderRadius: "10px", padding: "14px 16px", cursor: "pointer",
                textAlign: "left", transition: "all 0.15s",
              }}
            >
              <div style={{
                width: "18px", height: "18px", borderRadius: "50%",
                border: `2px solid ${sel ? "#005B65" : "#D1D5DB"}`,
                background: sel ? "#005B65" : "#fff", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {sel && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#fff" }} />}
              </div>
              <span style={{ fontSize: "15px", color: "#1B1B1B", fontWeight: sel ? 600 : 400 }}>{opt.label}</span>
            </button>
          );
        })}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

function CheckboxGroup({ options, values, onChange, max }: { options: string[]; values: string[]; onChange: (v: string[]) => void; max?: number }) {
  function toggle(opt: string) {
    if (values.includes(opt)) { onChange(values.filter(v => v !== opt)); return; }
    if (max && values.length >= max) return;
    onChange([...values, opt]);
  }
  return (
    <div>
      {max && <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "8px" }}>Select up to {max}</p>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {options.map(opt => {
        const sel = values.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            style={{
              display: "flex", alignItems: "center", gap: "12px",
              background: sel ? "#EEF6F7" : "#fff",
              border: `2px solid ${sel ? "#005B65" : "#E5E7EB"}`,
              borderRadius: "8px", padding: "12px 14px", cursor: "pointer",
              textAlign: "left", transition: "all 0.15s",
              opacity: (max && values.length >= max && !sel) ? 0.4 : 1,
            }}
          >
            <div style={{
              width: "18px", height: "18px", borderRadius: "4px",
              border: `2px solid ${sel ? "#005B65" : "#D1D5DB"}`,
              background: sel ? "#005B65" : "#fff", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span style={{ fontSize: "14px", color: "#1B1B1B" }}>{opt}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}

function SliderInput({ value, onChange, min = 1, max = 5, labels }: any) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        {labels && labels.map((l: string, i: number) => <span key={i} style={{ fontSize: "12px", color: "#9CA3AF" }}>{l}</span>)}
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#005B65" }} />
      <div style={{ textAlign: "center", marginTop: "8px", fontSize: "24px", fontWeight: 700, color: "#005B65" }}>{value} / {max}</div>
    </div>
  );
}

// ─── Section headers ──────────────────────────────────────────────────────────

const SECTION_HEADERS = [
  { num: "01", title: "Qualification & Contact",         sub: "Tell us about you and your organization." },
  { num: "02", title: "Current AI Maturity",             sub: "Where are you today in your AI journey?" },
  { num: "03", title: "Strategic Context",               sub: "Help us understand your goals, timeline, and authority." },
  { num: "04", title: "HCAIF Readiness",                 sub: "Assessing your people and culture readiness for AI." },
  { num: "05", title: "Pain Points & Intent",            sub: "What's holding you back, and how did you find us?" },
  { num: "06", title: "Engagement Preferences",          sub: "How would you like to engage with Madavi?" },
  { num: "07", title: "Data Infrastructure",             sub: "Data is the foundation of every successful AI initiative." },
  { num: "08", title: "Technical Capabilities",          sub: "What does your current IT landscape look like?" },
  { num: "09", title: "Success Metrics & KPIs",          sub: "How do you define and measure success?" },
  { num: "10", title: "Risk Management & Governance",    sub: "How does your organization approach AI risk?" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIAuditForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);

  // Scroll to top of form on every step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Parallax blobs — move at different rates as user scrolls
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (blob1Ref.current) blob1Ref.current.style.transform = `translateY(${y * 0.38}px)`;
      if (blob2Ref.current) blob2Ref.current.style.transform = `translateY(${y * 0.22}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const TOTAL = 10;
  const progress = Math.round(((step + 1) / TOTAL) * 100);
  const hdr = SECTION_HEADERS[step];

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f: FormState) => ({ ...f, [key]: val }));
    setErrors((e) => { const n = { ...e }; delete n[key as string]; return n; });
  }

  function goNext() {
    const errs = validate(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s: number) => s + 1);
  }

  async function submit() {
    const errs = validate(9, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/proposal.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json();
        setSubmitError(d.message || "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    const raw = calculateScore(form);
    const r = getReadiness(raw);
    return (
      <div style={{ maxWidth: "680px", margin: "80px auto", padding: "40px 24px", textAlign: "center" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: r.color, color: "#fff", fontSize: "32px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>✓</div>
        <h2 style={{ fontFamily: '"Lora", serif', fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "#1B1B1B", fontWeight: 700, marginBottom: "12px" }}>Your Assessment is Complete</h2>
        <div style={{ background: "#F9FAFB", border: "2px solid #E5E7EB", borderRadius: "16px", padding: "28px", margin: "24px 0" }}>
          <p style={{ fontSize: "13px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Your AI Readiness Score</p>
          <div style={{ fontSize: "56px", fontWeight: 800, color: r.color, lineHeight: 1 }}>{r.pct}<span style={{ fontSize: "24px" }}>/100</span></div>
          <p style={{ fontSize: "18px", fontWeight: 700, color: "#1B1B1B", marginTop: "12px" }}>{r.level}</p>
          <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px" }}>{r.desc}</p>
        </div>
        <p style={{ color: "#555", fontSize: "16px", lineHeight: 1.6 }}>Our team will review your results and reach out within 1 business day with your personalized AI readiness report.</p>
        <a href="/" style={{ display: "inline-block", marginTop: "32px", background: "#005B65", color: "#fff", padding: "14px 32px", borderRadius: "9999px", textDecoration: "none", fontWeight: 600, fontSize: "15px" }}>Back to Home</a>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Parallax background blobs */}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div ref={blob1Ref} style={{
          position: "absolute", top: "-40px", right: "-100px",
          width: "560px", height: "560px", borderRadius: "50%",
          background: "radial-gradient(circle at 45% 45%, rgba(0,91,101,0.07) 0%, transparent 68%)",
          willChange: "transform",
        }} />
        <div ref={blob2Ref} style={{
          position: "absolute", top: "280px", left: "-140px",
          width: "640px", height: "640px", borderRadius: "50%",
          background: "radial-gradient(circle at 55% 50%, rgba(30,180,156,0.05) 0%, transparent 65%)",
          willChange: "transform",
        }} />
      </div>

      {/* Progress */}
      <div style={{ padding: "88px 40px 0", maxWidth: "860px", margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ color: "#005B65", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Section {step + 1}</span>
            <span style={{ color: "#9CA3AF", fontSize: "12px" }}>of {TOTAL}</span>
          </div>
          <span style={{ color: "#9CA3AF", fontSize: "12px" }}>{progress}% complete</span>
        </div>
        <div style={{ height: "3px", background: "#F3F4F6", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#005B65", borderRadius: "2px", transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "40px 40px 0", maxWidth: "860px", margin: "0 auto", width: "100%" }}>
        {/* Section header */}
        <div style={{ marginBottom: "36px" }}>
          <h3 style={{ fontSize: "18px", color: "#005B65", fontWeight: 700, marginBottom: "8px" }}>{hdr.num} — {hdr.title}</h3>
          <p style={{ color: "#6B7280", fontSize: "16px" }}>{hdr.sub}</p>
        </div>

        {/* ── Section 1 ── */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <Label required>Full Name</Label>
                <TextInput placeholder="Jane Smith" value={form.fullName} onChange={(v: string) => set("fullName", v)} required error={errors.fullName} />
              </div>
              <div>
                <Label required>Work Email</Label>
                <TextInput type="email" placeholder="jane@company.com" value={form.workEmail} onChange={(v: string) => set("workEmail", v)} required error={errors.workEmail} />
              </div>
              <div>
                <Label required>Company Name</Label>
                <TextInput placeholder="Acme Inc." value={form.companyName} onChange={(v: string) => set("companyName", v)} required error={errors.companyName} />
              </div>
              <div>
                <Label required>Job Title / Role</Label>
                <SelectInput value={form.jobTitle} onChange={(v: string) => set("jobTitle", v)} placeholder="Select your role" error={errors.jobTitle}
                  options={["C-Suite / Executive","VP / Director","Manager / Team Lead","Individual Contributor","Consultant / Advisor","Other"]} />
              </div>
              <div>
                <Label required>Industry Vertical</Label>
                <SelectInput value={form.industry} onChange={(v: string) => set("industry", v)} placeholder="Select your industry" error={errors.industry}
                  options={["Law Firm","Healthcare","Nonprofit","E-commerce / Retail","African Enterprise","Financial Services","Technology","Education","Other"]} />
              </div>
              <div>
                <Label required>Company Size</Label>
                <SelectInput value={form.companySize} onChange={(v: string) => set("companySize", v)} placeholder="Select size" error={errors.companySize}
                  options={["1–10 employees","11–50 employees","51–200 employees","201–1,000 employees","1,000+ employees"]} />
              </div>
            </div>
            <div style={{ maxWidth: "50%" }}>
              <Label>Phone Number</Label>
              <TextInput type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={(v: string) => set("phone", v)} />
            </div>
          </div>
        )}

        {/* ── Section 2 ── */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label required>Where is your organization in AI adoption?</Label>
              <RadioGroup value={form.aiAdoptionStage} onChange={v => set("aiAdoptionStage", v)} error={errors.aiAdoptionStage}
                options={[{ label: "Not started", score: 0 },{ label: "Exploring", score: 5 },{ label: "Piloting", score: 10 },{ label: "Scaling", score: 15 },{ label: "Optimizing", score: 20 }]} />
            </div>
            <div>
              <Label>AI tools currently in use</Label>
              <CheckboxGroup values={form.aiToolsInUse} onChange={v => set("aiToolsInUse", v)}
                options={["ChatGPT / LLMs","Microsoft Copilot","Google AI / Gemini","Industry-specific AI tools","Custom-built AI solutions","None","Other"]} />
            </div>
            <div>
              <Label required>Monthly AI spend</Label>
              <RadioGroup value={form.monthlyAISpend} onChange={v => set("monthlyAISpend", v)} error={errors.monthlyAISpend}
                options={[{ label: "$0", score: 0 },{ label: "Less than $500", score: 5 },{ label: "$500–$2K", score: 10 },{ label: "$2K–$10K", score: 15 },{ label: "$10K+", score: 20 }]} />
            </div>
            <div>
              <Label required>Dedicated AI team or resources</Label>
              <RadioGroup value={form.dedicatedAITeam} onChange={v => set("dedicatedAITeam", v)} error={errors.dedicatedAITeam}
                options={[{ label: "Full dedicated team", score: 15 },{ label: "Part-time resources", score: 10 },{ label: "Planning to hire", score: 5 },{ label: "No team", score: 0 }]} />
            </div>
          </div>
        )}

        {/* ── Section 3 ── */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label required>Primary AI goal</Label>
              <RadioGroup value={form.primaryAIGoal} onChange={v => set("primaryAIGoal", v)} error={errors.primaryAIGoal}
                options={[{ label: "Efficiency & cost reduction", score: 10 },{ label: "Revenue growth", score: 15 },{ label: "Customer experience", score: 10 },{ label: "Competitive advantage", score: 15 }]} />
            </div>
            <div>
              <Label required>Implementation timeline</Label>
              <RadioGroup value={form.implementationTimeline} onChange={v => set("implementationTimeline", v)} error={errors.implementationTimeline}
                options={[{ label: "Exploring (6–12+ months)", score: 5 },{ label: "Planning (3–6 months)", score: 10 },{ label: "Ready now (0–3 months)", score: 20 }]} />
            </div>
            <div>
              <Label required>Your decision authority</Label>
              <RadioGroup value={form.decisionAuthority} onChange={v => set("decisionAuthority", v)} error={errors.decisionAuthority}
                options={[{ label: "Decision-maker", score: 20 },{ label: "Key influencer", score: 15 },{ label: "Researcher/evaluator", score: 5 },{ label: "Other", score: 0 }]} />
            </div>
            <div>
              <Label required>Annual AI investment budget</Label>
              <RadioGroup value={form.annualAIBudget} onChange={v => set("annualAIBudget", v)} error={errors.annualAIBudget}
                options={[{ label: "Not yet determined", score: 0 },{ label: "Under $25K", score: 5 },{ label: "$25K–$100K", score: 10 },{ label: "$100K–$500K", score: 15 },{ label: "$500K+", score: 20 }]} />
            </div>
          </div>
        )}

        {/* ── Section 4 ── */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label required>Team change readiness</Label>
              <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "12px" }}>How open is your team to changing the way they work? (1 = Very resistant, 5 = Highly enthusiastic)</p>
              <SliderInput value={form.teamChangeReadiness} onChange={(v: number) => set("teamChangeReadiness", v)} labels={["1 — Resistant", "5 — Enthusiastic"]} />
            </div>
            <div>
              <Label required>Team AI literacy</Label>
              <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "12px" }}>How well does your team understand AI concepts and capabilities? (1 = No knowledge, 5 = Expert level)</p>
              <SliderInput value={form.teamAILiteracy} onChange={(v: number) => set("teamAILiteracy", v)} labels={["1 — No knowledge", "5 — Expert"]} />
            </div>
            <div>
              <Label required>Leadership buy-in for AI initiatives</Label>
              <RadioGroup value={form.leadershipBuyIn} onChange={v => set("leadershipBuyIn", v)} error={errors.leadershipBuyIn}
                options={[{ label: "Strong champion", score: 15 },{ label: "Supportive", score: 10 },{ label: "Neutral", score: 5 },{ label: "Skeptical", score: 0 }]} />
            </div>
            <div>
              <Label>Ethical or compliance concerns (select all that apply)</Label>
              <CheckboxGroup values={form.ethicalConcerns} onChange={v => set("ethicalConcerns", v)}
                options={["Data privacy","Bias / fairness","Regulatory compliance","Job displacement","None of the above"]} />
            </div>
          </div>
        )}

        {/* ── Section 5 ── */}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label>Top challenges (select up to 3)</Label>
              <CheckboxGroup values={form.topChallenges} onChange={v => set("topChallenges", v)} max={3}
                options={["Don't know where to start","Lack of internal expertise","Budget constraints","Resistance to change","Data quality issues","Unclear ROI","Vendor selection paralysis"]} />
            </div>
            <div>
              <Label>What immediate help are you looking for?</Label>
              <textarea
                placeholder="Describe your most pressing AI challenge or question…"
                value={form.immediateHelp} onChange={e => set("immediateHelp", e.target.value)} rows={4}
                style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "8px", padding: "12px 14px", color: "#1B1B1B", fontSize: "15px", width: "100%", fontFamily: "Inter, sans-serif", outline: "none", resize: "none" }}
              />
            </div>
            <div>
              <Label required>How did you hear about Madavi?</Label>
              <SelectInput value={form.hearAboutUs} onChange={(v: string) => set("hearAboutUs", v)} placeholder="Select source" error={errors.hearAboutUs}
                options={["LinkedIn","Google / Search","Referral","Conference / Event","Email / Newsletter","Other"]} />
            </div>
          </div>
        )}

        {/* ── Section 6 ── */}
        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <button type="button" onClick={() => set("subscribeNewsletter", !form.subscribeNewsletter)}
                style={{ display: "flex", alignItems: "center", gap: "14px", background: form.subscribeNewsletter ? "#EEF6F7" : "#fff", border: `2px solid ${form.subscribeNewsletter ? "#005B65" : "#E5E7EB"}`, borderRadius: "10px", padding: "16px 18px", cursor: "pointer", width: "100%" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: `2px solid ${form.subscribeNewsletter ? "#005B65" : "#D1D5DB"}`, background: form.subscribeNewsletter ? "#005B65" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {form.subscribeNewsletter && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontWeight: 600, fontSize: "15px", color: "#1B1B1B" }}>Subscribe to Madavi's newsletter</p>
                  <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>AI insights, case studies, and strategic updates — delivered monthly.</p>
                </div>
              </button>
            </div>
            <div>
              <Label>I'm interested in (select all that apply)</Label>
              <CheckboxGroup values={form.interestedIn} onChange={v => set("interestedIn", v)}
                options={["Free consultation call","AI case studies","Personalized AI roadmap","Executive briefing","Custom AI workshop"]} />
            </div>
          </div>
        )}

        {/* ── Section 7 ── */}
        {step === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label required>Data availability in your organization</Label>
              <RadioGroup value={form.dataAvailability} onChange={v => set("dataAvailability", v)} error={errors.dataAvailability}
                options={[{ label: "Clean and accessible", score: 20 },{ label: "Exists, needs cleaning", score: 15 },{ label: "Scattered/siloed", score: 10 },{ label: "Limited infrastructure", score: 0 }]} />
            </div>
            <div>
              <Label required>Data governance maturity</Label>
              <RadioGroup value={form.dataGovernance} onChange={v => set("dataGovernance", v)} error={errors.dataGovernance}
                options={[{ label: "Formal policies in place", score: 15 },{ label: "Basic policies", score: 10 },{ label: "Informal only", score: 5 },{ label: "No framework", score: 0 }]} />
            </div>
            <div>
              <Label>Data challenges (select all that apply)</Label>
              <CheckboxGroup values={form.dataChallenges} onChange={v => set("dataChallenges", v)}
                options={["Data silos","Poor data quality","No data standards","Privacy concerns","Insufficient data volume","Legacy system integration"]} />
            </div>
            <div>
              <Label required>How easily can your team access needed data?</Label>
              <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "12px" }}>(1 = Very difficult, 5 = Instant access)</p>
              <SliderInput value={form.dataAccessibility} onChange={(v: number) => set("dataAccessibility", v)} labels={["1 — Very difficult", "5 — Instant access"]} />
            </div>
          </div>
        )}

        {/* ── Section 8 ── */}
        {step === 7 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label required>Current IT infrastructure</Label>
              <RadioGroup value={form.itInfrastructure} onChange={v => set("itInfrastructure", v)} error={errors.itInfrastructure}
                options={[{ label: "Cloud-native, API-enabled", score: 20 },{ label: "Mix of cloud/on-premise", score: 15 },{ label: "Primarily on-premise", score: 10 },{ label: "Legacy systems", score: 0 }]} />
            </div>
            <div>
              <Label required>Technical talent in your team</Label>
              <RadioGroup value={form.technicalTalent} onChange={v => set("technicalTalent", v)} error={errors.technicalTalent}
                options={[{ label: "Strong team with AI experience", score: 15 },{ label: "Capable team, learning AI", score: 10 },{ label: "Basic IT, no AI expertise", score: 0 }]} />
            </div>
            <div>
              <Label required>Integration capability</Label>
              <RadioGroup value={form.integrationCapability} onChange={v => set("integrationCapability", v)} error={errors.integrationCapability}
                options={[{ label: "APIs well-established", score: 15 },{ label: "Some integration capability", score: 10 },{ label: "Manual processes", score: 5 },{ label: "Siloed systems", score: 0 }]} />
            </div>
            <div>
              <Label required>Security & compliance posture</Label>
              <RadioGroup value={form.securityCompliance} onChange={v => set("securityCompliance", v)} error={errors.securityCompliance}
                options={[{ label: "Enterprise-grade framework", score: 10 },{ label: "Standard practices", score: 7 },{ label: "Basic measures", score: 4 },{ label: "Ad-hoc approach", score: 0 }]} />
            </div>
          </div>
        )}

        {/* ── Section 9 ── */}
        {step === 8 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label required>How clearly defined are your success metrics?</Label>
              <RadioGroup value={form.successMeasurementClarity} onChange={v => set("successMeasurementClarity", v)} error={errors.successMeasurementClarity}
                options={[{ label: "Clear KPIs defined and tracked", score: 20 },{ label: "KPIs identified, not tracked", score: 15 },{ label: "General goals only", score: 5 },{ label: "No measurement defined", score: 0 }]} />
            </div>
            <div>
              <Label>Metrics you intend to track (select all that apply)</Label>
              <CheckboxGroup values={form.metricsToTrack} onChange={v => set("metricsToTrack", v)}
                options={["Cost savings","Revenue impact","Customer satisfaction","Employee productivity","Cycle time / speed","Error reduction","Other"]} />
            </div>
            <div>
              <Label required>Current performance baseline</Label>
              <RadioGroup value={form.baselineMeasurement} onChange={v => set("baselineMeasurement", v)} error={errors.baselineMeasurement}
                options={[{ label: "Track current performance", score: 15 },{ label: "Some baseline exists", score: 10 },{ label: "Limited baseline", score: 5 },{ label: "No baseline", score: 0 }]} />
            </div>
            <div>
              <Label required>Expected ROI timeline</Label>
              <RadioGroup value={form.roiExpectation} onChange={v => set("roiExpectation", v)} error={errors.roiExpectation}
                options={[{ label: "0–6 months", score: 15 },{ label: "6–12 months", score: 10 },{ label: "12–24 months", score: 5 },{ label: "Beyond 24 months", score: 0 }]} />
            </div>
          </div>
        )}

        {/* ── Section 10 ── */}
        {step === 9 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <Label required>AI governance framework</Label>
              <RadioGroup value={form.aiGovernanceFramework} onChange={v => set("aiGovernanceFramework", v)} error={errors.aiGovernanceFramework}
                options={[{ label: "Formal governance established", score: 20 },{ label: "In development", score: 15 },{ label: "Informal oversight", score: 10 },{ label: "No framework", score: 0 }]} />
            </div>
            <div>
              <Label>Risk mitigation concerns (select all that apply)</Label>
              <CheckboxGroup values={form.riskMitigationConcerns} onChange={v => set("riskMitigationConcerns", v)}
                options={["Model accuracy","Data privacy / security","Regulatory compliance","Ethical AI","Vendor risk","None"]} />
            </div>
            <div>
              <Label required>Compliance requirements</Label>
              <RadioGroup value={form.complianceRequirements} onChange={v => set("complianceRequirements", v)} error={errors.complianceRequirements}
                options={[{ label: "Heavily regulated, critical compliance needs", score: 10 },{ label: "Moderate requirements", score: 7 },{ label: "Light requirements", score: 4 }]} />
            </div>
            <div>
              <Label required>Risk appetite</Label>
              <RadioGroup value={form.riskAppetite} onChange={v => set("riskAppetite", v)} error={errors.riskAppetite}
                options={[{ label: "Willing to pilot and iterate", score: 15 },{ label: "Cautious, need proven solutions", score: 10 },{ label: "Risk-averse, need guarantees", score: 0 }]} />
            </div>
          </div>
        )}
      </div>

      {/* Turnstile — shown only on final step */}
      {step === 9 && (
        <div style={{ padding: "0 40px", maxWidth: "860px", margin: "24px auto 0", width: "100%" }}>
          <Turnstile
            ref={turnstileRef}
            siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            options={{ theme: "light" }}
          />
        </div>
      )}

      {/* Navigation */}
      <div style={{ borderTop: "1px solid #F3F4F6", padding: "20px 40px", maxWidth: "860px", margin: "32px auto 0", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {step > 0 ? (
          <button onClick={() => { setErrors({}); setStep((s: number) => s - 1); }}
            style={{ background: "none", color: "#6B7280", border: "1.5px solid #E5E7EB", borderRadius: "9999px", fontSize: "14px", fontWeight: 500, cursor: "pointer", padding: "10px 20px" }}>
            ← Back
          </button>
        ) : (
          <div />
        )}
        {submitError && <p style={{ color: ERR, fontSize: "13px", maxWidth: "260px", textAlign: "center" }}>{submitError}</p>}
        {step < 9 ? (
          <button onClick={goNext}
            style={{ background: "#005B65", color: "#fff", border: "none", borderRadius: "9999px", padding: "14px 28px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
            Next →
          </button>
        ) : (
          <button onClick={submit} disabled={submitting || !turnstileToken}
            style={{ background: "#005B65", color: "#fff", border: "none", borderRadius: "9999px", padding: "14px 28px", fontSize: "15px", fontWeight: 600, cursor: "pointer", opacity: (submitting || !turnstileToken) ? 0.5 : 1 }}>
            {submitting ? "Submitting…" : "Get My AI Readiness Report →"}
          </button>
        )}
      </div>
    </div>
  );
}
