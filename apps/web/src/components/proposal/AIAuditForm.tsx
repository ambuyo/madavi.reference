import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  fullName: string; workEmail: string; companyName: string; jobTitle: string;
  industry: string; companySize: string; phone: string;
  aiAdoptionStage: string; aiToolsInUse: string[]; monthlyAISpend: string; dedicatedAITeam: string;
  primaryAIGoal: string; implementationTimeline: string; decisionAuthority: string; annualAIBudget: string;
  teamChangeReadiness: number; teamAILiteracy: number; leadershipBuyIn: string; ethicalConcerns: string[];
  topChallenges: string[]; immediateHelp: string; hearAboutUs: string;
  subscribeNewsletter: boolean; interestedIn: string[];
  dataAvailability: string; dataGovernance: string; dataChallenges: string[]; dataAccessibility: number;
  itInfrastructure: string; technicalTalent: string; integrationCapability: string; securityCompliance: string;
  successMeasurementClarity: string; metricsToTrack: string[]; baselineMeasurement: string; roiExpectation: string;
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
  if (pct >= 90) return { pct, level: "AI-Ready Leader",   desc: "Scale mode — ready for enterprise-wide deployment.", color: "#005B65" };
  if (pct >= 75) return { pct, level: "Advanced Adopter",  desc: "Strong foundation — ready to expand from pilot to scale.", color: "#1EB49C" };
  if (pct >= 60) return { pct, level: "Strategic Builder", desc: "Building capabilities systematically toward your first pilot.", color: "#F59E0B" };
  if (pct >= 40) return { pct, level: "Early Explorer",    desc: "Early-stage exploration — foundation work comes first.", color: "#F97316" };
  return              { pct, level: "Getting Started",    desc: "Education and planning are the right next steps.", color: "#EF4444" };
}

// ─── Question definitions ─────────────────────────────────────────────────────

type QuestionType = "text" | "email" | "tel" | "select" | "radio" | "checkbox" | "slider" | "textarea" | "toggle";

interface Question {
  id: keyof FormState;
  label: string;
  sublabel?: string;
  type: QuestionType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  max?: number;
  min?: number;
  sliderLabels?: [string, string];
  cols?: number;
}

const QUESTIONS: Question[] = [
  { id: "fullName",    label: "What is your full name?",              type: "text",  placeholder: "Jane Smith",            required: true },
  { id: "workEmail",   label: "What's your work email?",              type: "email", placeholder: "jane@company.com",      required: true },
  { id: "companyName", label: "What company do you work for?",        type: "text",  placeholder: "Acme Inc.",             required: true },
  { id: "jobTitle",    label: "What is your role?",                   type: "select", required: true,
    options: ["C-Suite / Executive","VP / Director","Manager / Team Lead","Individual Contributor","Consultant / Advisor","Other"] },
  { id: "industry",    label: "Which industry are you in?",           type: "select", required: true,
    options: ["Law Firm","Healthcare","Nonprofit","E-commerce / Retail","African Enterprise","Financial Services","Technology","Education","Other"] },
  { id: "companySize", label: "How large is your organization?",      type: "radio", required: true, cols: 2,
    options: ["1–10","11–50","51–200","201–1,000","1,000+"] },
  { id: "phone",       label: "Best phone number to reach you?",      type: "tel",   placeholder: "+254 7XX XXX XXX" },
  { id: "aiAdoptionStage", label: "Where is your organization in its AI journey?", type: "radio", required: true, cols: 2,
    options: ["Not started","Exploring","Piloting","Scaling","Optimizing"] },
  { id: "aiToolsInUse", label: "Which AI tools is your team currently using?", type: "checkbox", cols: 2,
    options: ["ChatGPT / LLMs","Microsoft Copilot","Google AI / Gemini","Industry-specific AI tools","Custom-built AI solutions","None","Other"] },
  { id: "monthlyAISpend", label: "What is your approximate monthly AI spend?", type: "radio", required: true, cols: 2,
    options: ["$0","Less than $500","$500–$2K","$2K–$10K","$10K+"] },
  { id: "dedicatedAITeam", label: "Do you have dedicated AI resources or team?", type: "radio", required: true, cols: 2,
    options: ["Full dedicated team","Part-time resources","Planning to hire","No team"] },
  { id: "primaryAIGoal", label: "What is your primary goal for AI?", type: "radio", required: true,
    options: ["Efficiency & cost reduction","Revenue growth","Customer experience","Competitive advantage"] },
  { id: "implementationTimeline", label: "What is your implementation timeline?", type: "radio", required: true,
    options: ["Ready now (0–3 months)","Planning (3–6 months)","Exploring (6–12+ months)"] },
  { id: "decisionAuthority", label: "What is your decision-making authority?", type: "radio", required: true,
    options: ["Decision-maker","Key influencer","Researcher/evaluator","Other"] },
  { id: "annualAIBudget", label: "What is your annual budget for AI investment?", type: "radio", required: true,
    options: ["Not yet determined","Under $25K","$25K–$100K","$100K–$500K","$500K+"] },
  { id: "teamChangeReadiness", label: "How open is your team to change?", sublabel: "1 = Very resistant · 5 = Highly enthusiastic",
    type: "slider", min: 1, max: 5, sliderLabels: ["Resistant", "Enthusiastic"] },
  { id: "teamAILiteracy", label: "How well does your team understand AI?", sublabel: "1 = No knowledge · 5 = Expert level",
    type: "slider", min: 1, max: 5, sliderLabels: ["No knowledge", "Expert"] },
  { id: "leadershipBuyIn", label: "How strong is leadership buy-in for AI?", type: "radio", required: true, cols: 2,
    options: ["Strong champion","Supportive","Neutral","Skeptical"] },
  { id: "ethicalConcerns", label: "Any ethical or compliance concerns?", sublabel: "Select all that apply.", type: "checkbox", cols: 2,
    options: ["Data privacy","Bias / fairness","Regulatory compliance","Job displacement","None of the above"] },
  { id: "topChallenges", label: "What are your top challenges?", sublabel: "Pick up to 3.", type: "checkbox", max: 3, cols: 2,
    options: ["Don't know where to start","Lack of internal expertise","Budget constraints","Resistance to change","Data quality issues","Unclear ROI","Vendor selection paralysis"] },
  { id: "immediateHelp", label: "What immediate help are you looking for?", type: "textarea",
    placeholder: "Describe your most pressing AI challenge…" },
  { id: "hearAboutUs", label: "How did you hear about Madavi?", type: "select", required: true,
    options: ["LinkedIn","Google / Search","Referral","Conference / Event","Email / Newsletter","Other"] },
  { id: "interestedIn", label: "What are you most interested in?", sublabel: "Select all that apply.", type: "checkbox", cols: 2,
    options: ["Free consultation call","AI case studies","Personalized AI roadmap","Executive briefing","Custom AI workshop"] },
  { id: "dataAvailability", label: "How would you describe your organization's data?", type: "radio", required: true, cols: 2,
    options: ["Clean and accessible","Exists, needs cleaning","Scattered/siloed","Limited infrastructure"] },
  { id: "dataGovernance", label: "How mature is your data governance?", type: "radio", required: true, cols: 2,
    options: ["Formal policies in place","Basic policies","Informal only","No framework"] },
  { id: "dataChallenges", label: "What data challenges do you face?", sublabel: "Select all that apply.", type: "checkbox", cols: 2,
    options: ["Data silos","Poor data quality","No data standards","Privacy concerns","Insufficient data volume","Legacy system integration"] },
  { id: "dataAccessibility", label: "How easily can your team access the data they need?", sublabel: "1 = Very difficult · 5 = Instant access",
    type: "slider", min: 1, max: 5, sliderLabels: ["Very difficult", "Instant access"] },
  { id: "itInfrastructure", label: "How would you describe your IT infrastructure?", type: "radio", required: true, cols: 2,
    options: ["Cloud-native, API-enabled","Mix of cloud/on-premise","Primarily on-premise","Legacy systems"] },
  { id: "technicalTalent", label: "What is your team's technical AI capability?", type: "radio", required: true,
    options: ["Strong team with AI experience","Capable team, learning AI","Basic IT, no AI expertise"] },
  { id: "integrationCapability", label: "How strong are your integration capabilities?", type: "radio", required: true,
    options: ["APIs well-established","Some integration capability","Manual processes","Siloed systems"] },
  { id: "securityCompliance", label: "What is your security & compliance posture?", type: "radio", required: true,
    options: ["Enterprise-grade framework","Standard practices","Basic measures","Ad-hoc approach"] },
  { id: "successMeasurementClarity", label: "How clearly defined are your AI success metrics?", type: "radio", required: true,
    options: ["Clear KPIs defined and tracked","KPIs identified, not tracked","General goals only","No measurement defined"] },
  { id: "metricsToTrack", label: "Which metrics do you intend to track?", sublabel: "Select all that apply.", type: "checkbox",
    options: ["Cost savings","Revenue impact","Customer satisfaction","Employee productivity","Cycle time / speed","Error reduction","Other"] },
  { id: "baselineMeasurement", label: "Do you currently track performance baselines?", type: "radio", required: true,
    options: ["Track current performance","Some baseline exists","Limited baseline","No baseline"] },
  { id: "roiExpectation", label: "When do you expect to see ROI from AI?", type: "radio", required: true,
    options: ["0–6 months","6–12 months","12–24 months","Beyond 24 months"] },
  { id: "aiGovernanceFramework", label: "Do you have an AI governance framework?", type: "radio", required: true,
    options: ["Formal governance established","In development","Informal oversight","No framework"] },
  { id: "riskMitigationConcerns", label: "What are your top risk concerns?", sublabel: "Select all that apply.", type: "checkbox",
    options: ["Model accuracy","Data privacy / security","Regulatory compliance","Ethical AI","Vendor risk","None"] },
  { id: "complianceRequirements", label: "How regulated is your industry?", type: "radio", required: true,
    options: ["Heavily regulated, critical compliance needs","Moderate requirements","Light requirements"] },
  { id: "riskAppetite", label: "What best describes your organization's risk appetite?", type: "radio", required: true,
    options: ["Willing to pilot and iterate","Cautious, need proven solutions","Risk-averse, need guarantees"] },
  { id: "subscribeNewsletter", label: "Stay updated with AI insights", type: "toggle",
    options: ["Subscribe to our newsletter"] },
];

const TOTAL = QUESTIONS.length;

// ─── Step groupings (10 steps, ~4 questions per step) ────────────────────────

const STEPS = [
  [0, 1, 2, 3, 4, 5, 6],                           // 1. Personal Info (7q)
  [7, 8, 9, 10],                                   // 2. AI Adoption (4q)
  [11, 12, 13, 14],                                // 3. AI Goals (4q)
  [15, 16, 17, 18],                                // 4. Team & Leadership (4q)
  [19, 22, 21, 23, 20],                            // 5. Challenges & Engagement (5q)
  [24, 25, 26, 27],                                // 6. Data Foundation (4q)
  [28, 29, 30, 31],                                // 7. Technical Infrastructure (4q)
  [32, 33, 34, 35],                                // 8. Success Metrics (4q)
  [36, 37, 38, 39],                                // 9. AI Governance & Risk (4q)
];

const STEP_NAMES = [
  "Intro",
  "AI Adoption",
  "AI Goals",
  "Team Skills",
  "Org Challenges",
  "Data Foundation",
  "Tech Infrastructure",
  "Success & Metrics",
  "Governance & Risk",
];

const STEP_TOTAL = STEPS.length;

const BRAND = "#005B65";

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIAuditForm() {
  const [step, setStep]         = useState(0);
  const [form, setForm]         = useState<FormState>(() => {
    if (typeof window === "undefined") return INITIAL;
    const saved = sessionStorage.getItem("auditFormData");
    return saved ? JSON.parse(saved) : INITIAL;
  });
  const [error, setError]       = useState("");
  const [dir, setDir]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const inputRef     = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const currentStepQuestionIndices = STEPS[step];
  const currentStepQuestions = currentStepQuestionIndices.map(i => QUESTIONS[i]);
  const stepName = STEP_NAMES[step];

  useEffect(() => {
    setTimeout(() => { (inputRef.current as HTMLInputElement | null)?.focus(); }, 400);
  }, [step]);

  useEffect(() => {
    sessionStorage.setItem("auditFormData", JSON.stringify(form));
  }, [form]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
    setError("");
  }

  function toggleCheckbox(key: keyof FormState, opt: string, max?: number) {
    const arr = form[key] as string[];
    if (arr.includes(opt)) { set(key, arr.filter(v => v !== opt) as any); return; }
    if (max && arr.length >= max) return;
    set(key, [...arr, opt] as any);
  }

  function jumpToStep(target: number) {
    setError("");
    setDir(target > step ? 1 : -1);
    setStep(target);
  }

  function validateStep(questions: Question[]): string {
    for (const q of questions) {
      if (!q.required) continue;
      const val = form[q.id];
      if (q.type === "text" || q.type === "email" || q.type === "tel" || q.type === "textarea") {
        if (!(val as string).trim()) return `${q.label} is required.`;
        if (q.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val as string)) return "Enter a valid email address.";
      }
      if (q.type === "select" || q.type === "radio") {
        if (!(val as string)) return `Please select an option for: ${q.label}`;
      }
    }
    return "";
  }

  function advance() {
    const err = validateStep(currentStepQuestions);
    if (err) { setError(err); return; }
    setError("");
    setDir(1);
    if (step < STEP_TOTAL - 1) {
      setStep(s => s + 1);
    } else {
      handleSubmit();
    }
  }

  function back() {
    setError("");
    setDir(-1);
    setStep(s => s - 1);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const hasMultilineInput = currentStepQuestions.some(q => ["radio","checkbox","slider","toggle"].includes(q.type));
      if (hasMultilineInput) return;
      e.preventDefault();
      advance();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, form]);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/proposal.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      if (res.ok) {
        sessionStorage.removeItem("auditFormData");
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

  if (submitted) {
    const raw = calculateScore(form);
    const r   = getReadiness(raw);
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "#FAF5EF" }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-lg text-center"
        >
          <div className="size-20 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-8" style={{ background: r.color }}>✓</div>
          <h2 className="font-display text-4xl font-bold text-zinc-900 mb-3">Your assessment is complete.</h2>
          <p className="text-zinc-500 mb-8">Here's a snapshot of your AI readiness score. A <strong className="text-zinc-700">full personalised report</strong> with detailed findings, recommendations, and your custom AI roadmap is on its way to your inbox — expect it within 1 business day.</p>

          <div className="rounded-2xl border-2 border-zinc-100 p-8 mb-4" style={{ background: "#F9FAFB" }}>
            <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Your AI Readiness Score</p>
            <div className="text-7xl font-black leading-none mb-3" style={{ color: r.color }}>{r.pct}<span className="text-3xl">/100</span></div>
            <p className="text-xl font-bold text-zinc-900">{r.level}</p>
            <p className="text-sm text-zinc-500 mt-1">{r.desc}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 px-6 py-4 mb-8 flex items-start gap-3 text-left" style={{ background: "#FFF8F0" }}>
            <span className="text-xl mt-0.5">📬</span>
            <p className="text-sm text-zinc-600">
              <span className="font-semibold text-zinc-800">Your detailed report is being prepared.</span>{" "}
              We'll send a comprehensive AI readiness analysis — including gap assessment, priority actions, and vendor recommendations — to your email address.
            </p>
          </div>

          <a href="/" className="inline-block rounded-full px-8 py-3 font-semibold text-white text-sm" style={{ background: BRAND }}>Back to Home</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-[600px]" style={{ backgroundColor: "#FAF5EF" }}>

      {/* Banner */}
      <div className="px-6 py-4" style={{ backgroundColor: "#FAF5EF" }}>
        <p className="font-medium text-black font-display" style={{ fontSize: "28px" }}>
          Get your <span className="text-[#1EB49C] font-bold">AI Readiness Score</span> + custom roadmap{" "}
          <span className="rounded px-1.5 py-0.5 text-sm font-bold tracking-wide ml-1" style={{ backgroundColor: "#005B65", color: "#fff" }}>in 60 seconds</span>
        </p>
      </div>

      {/* Tab navigation — inline, sticky within column */}
      <div className="sticky top-24 z-30 bg-white border-b border-zinc-100 shadow-sm">
        <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex min-w-max">
            {STEP_NAMES.map((name, i) => {
              const isActive = i === step;
              const isDone   = i < step;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => jumpToStep(i)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-xs font-medium font-display whitespace-nowrap transition-all focus:outline-none ${
                    isActive
                      ? "text-white bg-[#005B65]"
                      : isDone
                      ? "text-[#1EB49C] hover:text-[#005B65] hover:bg-zinc-50"
                      : "text-[#1EB49C] hover:text-[#005B65]"
                  }`}
                >
                  <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    isActive ? "bg-white text-[#005B65]" : isDone ? "bg-zinc-200 text-zinc-600" : "bg-zinc-100 text-zinc-400"
                  }`}>
                    {isDone ? "✓" : i + 1}
                  </span>
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main question area */}
      <div className="flex flex-1 flex-col px-6 py-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, y: dir > 0 ? 48 : -48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dir > 0 ? -48 : 48 }}
              transition={{ duration: 0.35, ease: [0.32, 0, 0.67, 0] }}
              className="flex flex-col gap-8"
            >
              {/* Step badge & title */}
              <div>
                <span className="text-sm font-bold tracking-wider flex items-center gap-1.5" style={{ color: BRAND }}>
                  {step + 1} <svg className="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/></svg>
                </span>
                <h2 className="text-3xl font-light tracking-tight text-zinc-800 mt-3 md:text-4xl">{stepName}</h2>
              </div>

              {/* Questions grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {currentStepQuestions.map((q, idx) => (
                  <div key={q.id} className={`flex flex-col gap-3 ${currentStepQuestions.length === 1 || (idx === currentStepQuestions.length - 1 && currentStepQuestions.length % 2 === 1) ? "sm:col-span-2" : ""}`}>
                    <label className="text-sm font-medium text-zinc-700">
                      {q.label}{q.required && <span className="ml-1 text-red-400">*</span>}
                    </label>
                    {q.sublabel && <p className="text-xs text-zinc-400 -mt-1">{q.sublabel}</p>}

                    {/* ── Text / Email / Tel ── */}
                    {(q.type === "text" || q.type === "email" || q.type === "tel") && (
                      <input
                        ref={idx === 0 ? (inputRef as React.RefObject<HTMLInputElement>) : null}
                        type={q.type}
                        placeholder={q.placeholder}
                        value={form[q.id] as string}
                        onChange={e => set(q.id, e.target.value as any)}
                        className="w-full border-b border-zinc-300 bg-transparent py-3 text-base font-light focus:border-[#005B65] focus:outline-none transition-colors text-zinc-800 placeholder-zinc-300"
                      />
                    )}

                    {/* ── Textarea ── */}
                    {q.type === "textarea" && (
                      <textarea
                        ref={idx === 0 ? (inputRef as React.RefObject<HTMLTextAreaElement>) : null}
                        placeholder={q.placeholder}
                        value={form[q.id] as string}
                        onChange={e => set(q.id, e.target.value as any)}
                        rows={4}
                        className="w-full border border-zinc-200 rounded-lg bg-white px-3 py-3 text-sm font-light focus:border-[#005B65] focus:outline-none transition-colors text-zinc-800 placeholder-zinc-300 resize-none"
                      />
                    )}

                    {/* ── Select ── */}
                    {q.type === "select" && (
                      <div className="relative">
                        <select
                          value={form[q.id] as string}
                          onChange={e => { set(q.id, e.target.value as any); }}
                          className="w-full border-b border-zinc-300 bg-transparent py-3 text-base font-light appearance-none focus:border-[#005B65] focus:outline-none transition-colors text-zinc-800"
                          style={{ color: form[q.id] ? "#27272a" : "#d4d4d8" }}
                        >
                          <option value="" disabled style={{ color: "#d4d4d8" }}>{q.placeholder ?? "Select…"}</option>
                          {q.options!.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <svg className="absolute right-2 bottom-3 pointer-events-none text-zinc-400" width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}

                    {/* ── Radio ── */}
                    {q.type === "radio" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options!.map(o => (
                          <button key={o} type="button" onClick={() => { set(q.id, o as any); }}
                            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-left transition-all touch-manipulation ${
                              form[q.id] === o ? "bg-[#EEF6F7] text-[#005B65] font-medium border border-[#005B65]/20" : "text-zinc-700 bg-white border border-zinc-200 active:bg-zinc-50"
                            }`}
                          >
                            <span className={`size-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${form[q.id] === o ? "border-[#005B65] bg-[#005B65]" : "border-zinc-300 bg-white"}`}>
                              {form[q.id] === o && <span className="size-2 rounded-full bg-white" />}
                            </span>
                            {o}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* ── Checkbox ── */}
                    {q.type === "checkbox" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options!.map(o => {
                          const arr = form[q.id] as string[];
                          const sel = arr.includes(o);
                          const dis = !!q.max && arr.length >= q.max && !sel;
                          return (
                            <button key={o} type="button" onClick={() => toggleCheckbox(q.id, o, q.max)} disabled={dis}
                              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-left transition-all touch-manipulation ${
                                sel ? "bg-[#EEF6F7] text-[#005B65] font-medium border border-[#005B65]/20" : dis ? "bg-zinc-50 text-zinc-300 border border-zinc-100 cursor-not-allowed" : "text-zinc-700 bg-white border border-zinc-200 active:bg-zinc-50"
                              }`}
                            >
                              <span className={`size-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${sel ? "border-[#005B65] bg-[#005B65]" : "border-zinc-300 bg-white"}`}>
                                {sel && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </span>
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* ── Slider ── */}
                    {q.type === "slider" && (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between text-xs text-zinc-400">
                          {q.sliderLabels?.map((l, i) => <span key={i}>{l}</span>)}
                        </div>
                        <input type="range" min={q.min ?? 1} max={q.max ?? 5}
                          value={form[q.id] as number}
                          onChange={e => set(q.id, Number(e.target.value) as any)}
                          className="w-full accent-[#005B65] h-2 touch-manipulation"
                          style={{ height: "2rem" }}
                        />
                        <div className="text-center text-2xl font-bold" style={{ color: BRAND }}>
                          {form[q.id]}<span className="text-sm text-zinc-400 font-normal"> / {q.max ?? 5}</span>
                        </div>
                      </div>
                    )}

                    {/* ── Toggle ── */}
                    {q.type === "toggle" && (
                      <button
                        type="button"
                        onClick={() => set(q.id, !(form[q.id] as boolean) as any)}
                        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-left text-sm transition-all w-full touch-manipulation ${
                          form[q.id] ? "border-[#005B65] bg-[#EEF6F7] text-[#005B65] font-medium" : "border-zinc-200 bg-white text-zinc-800"
                        }`}
                      >
                        <span className={`w-11 h-6 rounded-full shrink-0 flex items-center transition-colors ${form[q.id] ? "bg-[#005B65]" : "bg-zinc-300"}`}>
                          <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form[q.id] ? "translate-x-6" : "translate-x-0.5"}`} />
                        </span>
                        {q.options?.[0] || "Enable"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-500 font-medium">
                  {error}
                </motion.p>
              )}

              {/* CTA row */}
              <div className="mt-4 pt-6 border-t border-zinc-200">
                {step === STEP_TOTAL - 1 && (
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
                    onSuccess={setTurnstileToken}
                    onExpire={() => setTurnstileToken(null)}
                    options={{ theme: "light" }}
                  />
                )}
                <div className="flex items-center justify-between gap-3">
                  {step > 0 ? (
                    <button onClick={back} type="button"
                      className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors font-medium">
                      ← Back
                    </button>
                  ) : <span />}
                  <button
                    type="button"
                    onClick={advance}
                    disabled={step === STEP_TOTAL - 1 && !turnstileToken}
                    className="rounded-lg px-10 py-3 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 touch-manipulation"
                    style={{ background: BRAND }}
                  >
                    {step === STEP_TOTAL - 1
                      ? (submitting ? "Submitting…" : "Get My AI Report →")
                      : "Next ✓"}
                  </button>
                </div>
              </div>

              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
