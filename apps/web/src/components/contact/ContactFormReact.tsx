import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

const SERVICES = [
  "AI Readiness Assessment",
  "Executive Advisory Retainer",
  "Leadership AI Fluency Cohort",
  "AI Agent Development",
  "Keynotes & Licensing",
  "Brand Strategy",
  "Brand Communication",
  "Brand Management",
  "Website Design",
  "SEO Services",
  "Other",
];

const contactSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  services: z.array(z.string()).max(3, "Select up to 3 services").optional().default([]),
  budget: z.string().optional().default("2k-5k"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  privacy: z.boolean().refine((val) => val === true, {
    message: "You must agree to the privacy policy",
  }),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactFormReact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: { services: [], budget: "2k-5k" },
  });

  const selectedServices = watch("services") ?? [];

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, service: data.services?.join(", "), turnstileToken }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setSubmitMessage("Message sent successfully! We'll be in touch soon.");
        reset();
        setTurnstileToken(null);
        turnstileRef.current?.reset();
      } else {
        setSubmitStatus("error");
        setSubmitMessage(result.message || "Failed to send message");
      }
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage("An error occurred. Please try again.");
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-base-80 p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
            Full Name *
          </label>
          <input
            {...register("name")}
            type="text"
            id="name"
            placeholder="Your full name"
            className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email Address *
          </label>
          <input
            {...register("email")}
            type="email"
            id="email"
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
            Phone Number
          </label>
          <input
            {...register("phone")}
            type="tel"
            id="phone"
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-white mb-2">
            Company Name
          </label>
          <input
            {...register("company")}
            type="text"
            id="company"
            placeholder="Your company name"
            className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
          />
        </div>
      </div>

      {/* Services */}
      <div>
        <p className="block text-sm font-medium text-white mb-1">
          Which services are you interested in?
        </p>
        <p className="text-xs text-white/50 mb-3">Select up to 3</p>
        <Controller
          name="services"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICES.map((s) => {
                const checked = field.value?.includes(s) ?? false;
                const atMax = (field.value?.length ?? 0) >= 3;
                return (
                  <label
                    key={s}
                    className={`flex items-center gap-3 px-4 py-3 border transition-colors cursor-pointer select-none ${
                      checked
                        ? "border-[#1EB49C] bg-[#1EB49C]/10 text-white"
                        : atMax && !checked
                        ? "border-white/10 bg-white/5 text-white/30 cursor-not-allowed"
                        : "border-white/20 bg-white/5 text-white/80 hover:border-white/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      disabled={atMax && !checked}
                      onChange={() => {
                        const next = checked
                          ? field.value?.filter((v) => v !== s) ?? []
                          : [...(field.value ?? []), s];
                        field.onChange(next);
                      }}
                    />
                    <span className={`flex-shrink-0 w-4 h-4 border rounded-sm flex items-center justify-center ${checked ? "bg-[#1EB49C] border-[#1EB49C]" : "border-white/30"}`}>
                      {checked && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <span className="text-sm">{s}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.services && (
          <p className="text-red-500 text-xs mt-1">{errors.services.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-white mb-2">
            Please Choose the Budget *
          </label>
          <select
            {...register("budget")}
            id="budget"
            className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
          >
            <option value="">Select your budget</option>
            <option value="2k-5k">$2k to $5k</option>
            <option value="5k-20k">$5k to $20k</option>
            <option value="20k-50k">$20k to $50k</option>
            <option value="50k-plus">$50k+</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
            Subject *
          </label>
          <input
            {...register("subject")}
            type="text"
            id="subject"
            placeholder="Brief description of your inquiry"
            className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
          />
          {errors.subject && (
            <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-white mb-2">
          Message *
        </label>
        <textarea
          {...register("message")}
          id="message"
          rows={6}
          placeholder="Please provide details about your inquiry..."
          className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10 resize-vertical"
        />
        {errors.message && (
          <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
        )}
      </div>

      {/* Privacy Checkbox */}
      <div className="flex items-start gap-3">
        <input
          {...register("privacy")}
          type="checkbox"
          id="privacy"
          className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500 border-base-300 rounded"
        />
        <label htmlFor="privacy" className="text-sm text-white">
          I agree to the{" "}
          <a
            href="/legal/privacy"
            className="text-accent-600 hover:text-accent-700 underline"
          >
            Privacy Policy
          </a>{" "}
          and consent to being contacted regarding my inquiry.
        </label>
      </div>
      {errors.privacy && (
        <p className="text-red-500 text-xs">{errors.privacy.message}</p>
      )}

      {/* Status Messages */}
      {submitStatus === "success" && (
        <div className="p-4 bg-green-900/20 border border-green-700 rounded text-green-400 text-sm">
          {submitMessage}
        </div>
      )}
      {submitStatus === "error" && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
          {submitMessage}
        </div>
      )}

      {/* Turnstile */}
      <Turnstile
        ref={turnstileRef}
        siteKey={import.meta.env.PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
        onSuccess={setTurnstileToken}
        onExpire={() => setTurnstileToken(null)}
        options={{ theme: "dark" }}
      />

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !turnstileToken}
        className="w-full px-6 py-3 text-black font-semibold rounded hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#fff" }}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
