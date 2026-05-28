import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

const contactSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().default(""),
  company: z.string().optional().default(""),
  service: z.string().optional().default(""),
  budget: z.string().optional().default(""),
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
    formState: { errors, isValid },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, turnstileToken }),
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service */}
        <div>
          <label htmlFor="service" className="block text-sm font-medium text-white mb-2">
            Service Interested In
          </label>
          <select
            {...register("service")}
            id="service"
            className="w-full px-4 py-3 border-b border-base-800 placeholder-white text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
          >
            <option value="">Select a service</option>
            <option value="ai-strategy">AI Strategy</option>
            <option value="ai-readiness">AI Readiness Assessment</option>
            <option value="implementation">AI Implementation</option>
            <option value="training">Team Training</option>
            <option value="other">Other</option>
          </select>
        </div>

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
