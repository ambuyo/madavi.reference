import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PricingTier {
  name: string;
  icon: React.ReactNode;
  price: string;
  currency?: string;
  period?: string;
  description: string;
  features: string[];
  popular?: boolean;
  iconColor?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function CreativePricing({
  tag = "Simple Pricing",
  title = "Choose your plan",
  description = "No contracts. No surprises.",
  tiers,
}: {
  tag?: string;
  title?: string;
  description?: string;
  tiers: PricingTier[];
}) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center space-y-6 mb-16">
        <div className="font-handwritten text-xl rotate-[-1deg]" style={{ color: "#fff" }}>
          {tag}
        </div>
        <div className="relative">
          <h2 className="text-4xl md:text-5xl font-bold font-handwritten rotate-[-1deg]" style={{ color: "#fff" }}>
            {title}
            <div className="absolute -right-12 top-0 rotate-12" style={{ color: "#fff" }}>
              ✨
            </div>
            <div className="absolute -left-8 bottom-0 -rotate-12" style={{ color: "#fff" }}>
              ⭐️
            </div>
          </h2>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-3 rounded-full blur-sm rotate-[-1deg]" style={{ background: "rgba(246,140,43,0.3)" }} />
        </div>
        <p className="font-handwritten text-xl rotate-[-1deg]" style={{ color: "#fff" }}>
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={cn(
              "relative group transition-all duration-300",
              index === 0 && "rotate-[-1deg]",
              index === 1 && "rotate-[1deg]",
              index === 2 && "rotate-[-2deg]"
            )}
          >
            {/* Card shadow layer */}
            <div
              className={cn(
                "absolute inset-0 bg-white dark:bg-zinc-900",
                "border-2 border-zinc-900 dark:border-white",
                "rounded-lg shadow-[4px_4px_0px_0px] shadow-zinc-900 dark:shadow-white",
                "transition-all duration-300",
                "group-hover:shadow-[8px_8px_0px_0px]",
                "group-hover:translate-x-[-4px]",
                "group-hover:translate-y-[-4px]"
              )}
            />

            <div className="relative p-6">
              {tier.popular && (
                <div
                  className="absolute -top-3 -right-2 font-handwritten px-3 py-1 rounded-full rotate-12 text-sm border-2 border-zinc-900 font-semibold"
                  style={{ background: "#FF5000", color: "#fff" }}
                >
                  Popular!
                </div>
              )}

              {/* Icon + name */}
              <div className="mb-6">
                <div
                  className="w-12 h-12 rounded-full mb-4 flex items-center justify-center border-2 border-zinc-900 dark:border-white"
                  style={{ color: tier.iconColor ?? "#1a3a2a" }}
                >
                  {tier.icon}
                </div>
                <h3 className="font-handwritten text-2xl text-zinc-900 dark:text-white">
                  {tier.name}
                </h3>
                <p className="font-handwritten text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                  {tier.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6 font-handwritten">
                {tier.currency && (
                  <span className="text-lg text-zinc-500 mr-1">{tier.currency}</span>
                )}
                <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                  {tier.price}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-1">
                  {tier.period ?? "/month"}
                </span>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-900 dark:border-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="font-handwritten text-base text-zinc-900 dark:text-white">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {tier.ctaHref ? (
                <a
                  href={tier.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full h-12 font-handwritten text-lg flex items-center justify-center rounded-md",
                    "border-2 border-zinc-900 dark:border-white transition-all duration-300",
                    "shadow-[4px_4px_0px_0px] shadow-zinc-900 dark:shadow-white",
                    "hover:shadow-[6px_6px_0px_0px] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                    tier.popular
                      ? "text-white"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-white"
                  )}
                  style={tier.popular ? { background: "#FF5000" } : undefined}
                >
                  {tier.ctaLabel ?? "Get Started"}
                </a>
              ) : (
                <Button
                  className={cn(
                    "w-full h-12 font-handwritten text-lg relative",
                    "border-2 border-zinc-900 dark:border-white transition-all duration-300",
                    "shadow-[4px_4px_0px_0px] shadow-zinc-900 dark:shadow-white",
                    "hover:shadow-[6px_6px_0px_0px] hover:translate-x-[-2px] hover:translate-y-[-2px]",
                    tier.popular
                      ? "text-white hover:opacity-90"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-white"
                  )}
                  style={tier.popular ? { background: "#FF5000" } : undefined}
                >
                  {tier.ctaLabel ?? "Get Started"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
