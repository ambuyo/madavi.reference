import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

const tapThriveSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  whatsapp: z.string().min(1, "WhatsApp number is required"),
  business: z.string().min(1, "Business name is required"),
  businessType: z.string().optional().default(""),
  plan: z.string().optional().default(""),
  locations: z.string().optional().default(""),
  hasGMB: z.string().optional().default(""),
  question: z.string().optional().default(""),
  privacy: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy",
  }),
});

type TapThriveFormData = z.infer<typeof tapThriveSchema>;

const businessTypes = [
  "Restaurant / Café",
  "Clinic / Pharmacy",
  "Salon / Spa",
  "Hotel / Hospitality",
  "Bank / SACCO",
  "Retail / Showroom",
  "Other",
];

const inputClass =
  "w-full px-4 py-3 border-b border-[#f68c2b] placeholder-base-400 text-base-900 border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-[#f68c2b] transition-colors bg-transparent";

const labelClass = "block text-sm font-medium text-base-900 mb-2";

export function TapThriveContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (submitStatus === "idle") return;
    setVisible(true);
    const fade = setTimeout(() => setVisible(false), 7000);
    const clear = setTimeout(() => setSubmitStatus("idle"), 7600);
    return () => { clearTimeout(fade); clearTimeout(clear); };
  }, [submitStatus, submitMessage]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TapThriveFormData>({
    resolver: zodResolver(tapThriveSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: TapThriveFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/tapthrive-contact.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         data.name,
          whatsapp:     data.whatsapp,
          business:     data.business,
          businessType: data.businessType,
          plan:         data.plan,
          locations:    data.locations,
          hasGMB:       data.hasGMB,
          question:     data.question,
          privacy:      data.privacy,
          turnstileToken,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setSubmitMessage("Demo request sent! We'll be in touch within one business day.");
        reset();
        setTurnstileToken(null);
        turnstileRef.current?.reset();
      } else {
        console.error("TapThrive API error:", result);
        setSubmitStatus("error");
        setSubmitMessage(result.detail || result.error || result.message || "Failed to send message. Please try again.");
      }
    } catch (err) {
      console.error("TapThrive form error:", err);
      setSubmitStatus("error");
      setSubmitMessage("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-8" style={{ backgroundColor: "#FAF5EF" }}>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label htmlFor="tt-name" className={labelClass}>Full Name *</label>
          <input
            {...register("name")}
            type="text"
            id="tt-name"
            placeholder="Your full name"
            className={inputClass}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* WhatsApp */}
        <div>
          <label htmlFor="tt-whatsapp" className={labelClass}>WhatsApp Number * <span className="text-base-400 font-normal">(We'll reply here)</span></label>
          <input
            {...register("whatsapp")}
            type="tel"
            id="tt-whatsapp"
            placeholder="+254 7XX XXX XXX"
            className={inputClass}
          />
          {errors.whatsapp && <p className="text-red-500 text-xs mt-1">{errors.whatsapp.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business name */}
        <div>
          <label htmlFor="tt-business" className={labelClass}>Business Name *</label>
          <input
            {...register("business")}
            type="text"
            id="tt-business"
            placeholder="e.g. Java House, Karen"
            className={inputClass}
          />
          {errors.business && <p className="text-red-500 text-xs mt-1">{errors.business.message}</p>}
        </div>

        {/* Business type */}
        <div>
          <label htmlFor="tt-biztype" className={labelClass}>Type of business</label>
          <select {...register("businessType")} id="tt-biztype" className={inputClass}>
            <option value="">Select your industry</option>
            {businessTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan */}
        <div>
          <label htmlFor="tt-plan" className={labelClass}>Plan of interest</label>
          <select {...register("plan")} id="tt-plan" className={inputClass}>
            <option value="">Select a plan</option>
            <option value="TapThrive NFC Review Card only — KSh 4,500 (one-off)">TapThrive NFC Review Card only — KSh 4,500 (one-off)</option>
            <option value="Tap — KSh 2,500/mo">Tap — KSh 2,500/mo</option>
            <option value="Tap + Grow — KSh 5,000/mo">Tap + Grow — KSh 5,000/mo</option>
            <option value="Tap + Glow — KSh 9,000/mo">Tap + Glow — KSh 9,000/mo</option>
            <option value="Enterprise / Multi-location">Enterprise / Multi-location</option>
            <option value="Not sure yet">Not sure yet</option>
          </select>
        </div>

        {/* Locations */}
        <div>
          <label htmlFor="tt-locations" className={labelClass}>Number of locations</label>
          <select {...register("locations")} id="tt-locations" className={inputClass}>
            <option value="">Select</option>
            <option value="1">1 location</option>
            <option value="2-5">2–5 locations</option>
            <option value="6-15">6–15 locations</option>
            <option value="15+">15+ locations</option>
          </select>
        </div>
      </div>

      {/* Google Business Profile */}
      <div>
        <label htmlFor="tt-gmb" className={labelClass}>
          Do you have an active Google Business Profile?
          <span className="text-white/40 font-normal ml-1">(affects setup cost)</span>
        </label>
        <select {...register("hasGMB")} id="tt-gmb" className={inputClass}>
          <option value="">Select an option</option>
          <option value="Yes — verified and live">Yes — verified and live</option>
          <option value="Yes — claimed but not optimised">Yes — claimed but not optimised</option>
          <option value="No — needs to be created">No — needs to be created</option>
          <option value="Not sure">Not sure</option>
        </select>
        <p className="text-white/40 text-xs mt-2">
          If you don't have a verified Google Business Profile, we'll set one up for you — this is charged separately (KSh 5,000) and takes 3–7 days including verification.
        </p>
      </div>

      {/* Optional question */}
      <div>
        <label htmlFor="tt-question" className={labelClass}>Anything specific you want to know? <span className="text-base-400 font-normal">(optional)</span></label>
        <textarea
          {...register("question")}
          id="tt-question"
          rows={3}
          placeholder="e.g. How does the WhatsApp follow-up work? Can I see a demo first?"
          className={`${inputClass} resize-vertical`}
        />
      </div>

      {/* Privacy */}
      <div className="flex items-start gap-3">
        <input
          {...register("privacy")}
          type="checkbox"
          id="tt-privacy"
          className="mt-1 h-4 w-4 accent-[#f68c2b] border-[#f68c2b] rounded"
        />
        <label htmlFor="tt-privacy" className="text-sm text-base-700">
          I agree to the{" "}
          <a href="/legal/privacy-policy" className="underline hover:opacity-80">
            Privacy Policy
          </a>{" "}
          and consent to being contacted about TapThrive.
        </label>
      </div>
      {errors.privacy && <p className="text-red-500 text-xs">{errors.privacy.message}</p>}

      {/* Status messages */}
      {submitStatus !== "idle" && (
        <div
          className={`p-4 rounded-lg text-sm font-medium shadow-lg transition-all duration-600 ${
            submitStatus === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-6px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {submitMessage}
        </div>
      )}

      {/* Turnstile — temporarily disabled */}
      {/* <Turnstile
        ref={turnstileRef}
        siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
        onSuccess={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        options={{ theme: "light" }}
      /> */}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 text-white font-semibold rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#f68c2b" }}
      >
        {isSubmitting ? "Sending..." : "Book A Demo"}
      </button>

    </form>
  );
}
