import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const eventRegistrationSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string(),
  company: z.string(),
  attendeeCount: z
    .number()
    .min(1, "At least 1 attendee required")
    .max(10, "Maximum 10 attendees"),
  dietaryRestrictions: z.string(),
  specialRequests: z.string(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
});

type EventRegistrationData = z.infer<typeof eventRegistrationSchema>;

interface EventRegistrationFormProps {
  eventId: string;
  eventTitle: string;
}

export function EventRegistrationForm({
  eventId,
  eventTitle,
}: EventRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EventRegistrationData>({
    resolver: zodResolver(eventRegistrationSchema),
    mode: "onBlur",
    defaultValues: {
      phone: "",
      company: "",
      dietaryRestrictions: "",
      specialRequests: "",
    },
  });

  const onSubmit = async (data: EventRegistrationData) => {
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/events/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          eventId,
          eventTitle,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setSubmitMessage(
          "Registration successful! Check your email for confirmation details.",
        );
        reset();
      } else {
        setSubmitStatus("error");
        setSubmitMessage(result.message || "Failed to register for event");
      }
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage("An error occurred. Please try again.");
      console.error("Event registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-black p-8">
      <h3 className="text-xl font-semibold text-white mb-6">
        Register for {eventTitle}
      </h3>

      {/* Full Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-base-300 mb-2"
        >
          Full Name *
        </label>
        <input
          {...register("name")}
          type="text"
          id="name"
          placeholder="Your full name"
          className="w-full px-4 py-3 border-b border-base-800 placeholder-base-400 text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-base-300 mb-2"
        >
          Email Address *
        </label>
        <input
          {...register("email")}
          type="email"
          id="email"
          placeholder="your.email@example.com"
          className="w-full px-4 py-3 border-b border-base-800 placeholder-base-400 text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-base-300 mb-2"
        >
          Phone Number
        </label>
        <input
          {...register("phone")}
          type="tel"
          id="phone"
          placeholder="(555) 123-4567"
          className="w-full px-4 py-3 border-b border-base-800 placeholder-base-400 text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
        />
      </div>

      {/* Company */}
      <div>
        <label
          htmlFor="company"
          className="block text-sm font-medium text-base-300 mb-2"
        >
          Company Name
        </label>
        <input
          {...register("company")}
          type="text"
          id="company"
          placeholder="Your company name"
          className="w-full px-4 py-3 border-b border-base-800 placeholder-base-400 text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
        />
      </div>

      {/* Attendee Count */}
      <div>
        <label
          htmlFor="attendeeCount"
          className="block text-sm font-medium text-base-300 mb-2"
        >
          Number of Attendees *
        </label>
        <select
          {...register("attendeeCount", { valueAsNumber: true })}
          id="attendeeCount"
          className="w-full px-4 py-3 border-b border-base-800 placeholder-base-400 text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
        >
          <option value="">Select number of attendees</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? "person" : "people"}
            </option>
          ))}
        </select>
        {errors.attendeeCount && (
          <p className="text-red-500 text-xs mt-1">
            {errors.attendeeCount.message}
          </p>
        )}
      </div>

      {/* Dietary Restrictions */}
      <div>
        <label
          htmlFor="dietaryRestrictions"
          className="block text-sm font-medium text-base-300 mb-2"
        >
          Dietary Restrictions
        </label>
        <input
          {...register("dietaryRestrictions")}
          type="text"
          id="dietaryRestrictions"
          placeholder="e.g., Vegetarian, Vegan, Gluten-free"
          className="w-full px-4 py-3 border-b border-base-800 placeholder-base-400 text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10"
        />
      </div>

      {/* Special Requests */}
      <div>
        <label
          htmlFor="specialRequests"
          className="block text-sm font-medium text-base-300 mb-2"
        >
          Special Requests
        </label>
        <textarea
          {...register("specialRequests")}
          id="specialRequests"
          rows={3}
          placeholder="Any special accommodations or requests..."
          className="w-full px-4 py-3 border-b border-base-800 placeholder-base-400 text-white border-x-0 border-t-0 focus:ring-0 focus:outline-none focus:border-base-800 transition-colors bg-white/5 focus:bg-white/10 resize-vertical"
        />
      </div>

      {/* Terms Checkbox */}
      <div className="flex items-start gap-3">
        <input
          {...register("terms")}
          type="checkbox"
          id="terms"
          className="mt-1 h-4 w-4 text-accent-600 focus:ring-accent-500 border-base-300 rounded"
        />
        <label htmlFor="terms" className="text-sm text-base-600">
          I agree to the event terms and conditions and will receive event
          updates via email.
        </label>
      </div>
      {errors.terms && (
        <p className="text-red-500 text-xs">{errors.terms.message}</p>
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-accent-400 text-black font-semibold rounded hover:bg-accent-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Registering..." : "Register for Event"}
      </button>
    </form>
  );
}
