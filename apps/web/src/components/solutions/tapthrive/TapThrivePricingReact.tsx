import { CreativePricing } from "@/components/ui/creative-pricing";
import type { PricingTier } from "@/components/ui/creative-pricing";
import { Wifi, TrendingUp, Sparkles } from "lucide-react";

const WA_BASE = "https://wa.me/254718735565?text=";

const tiers: PricingTier[] = [
  {
    name: "Tap",
    icon: <Wifi className="w-6 h-6" />,
    iconColor: "#f68c2b",
    currency: "KSh",
    price: "2,500",
    period: "/ month",
    description: "Reviews flowing. Zero manual effort.",
    popular: false,
    ctaLabel: "Get started",
    ctaHref: "#contact",
    features: [
      "Branded NFC card(s) active",
      "Smart landing page + sentiment filter",
      "Google review redirect",
      "Negative review → private inbox",
      "Monthly review report",
    ],
  },
  {
    name: "Tap + Grow",
    icon: <TrendingUp className="w-6 h-6" />,
    iconColor: "#f68c2b",
    currency: "KSh",
    price: "5,000",
    period: "/ month",
    description: "Reviews + a growing contact list — on autopilot.",
    popular: true,
    ctaLabel: "Get started",
    ctaHref: "#contact",
    features: [
      "Everything in Tap",
      "WhatsApp follow-up (2-hr nudge)",
      "Customer number capture (consent)",
      "Customer contact database",
      "Review velocity tracking",
    ],
  },
  {
    name: "Tap + Glow",
    icon: <Sparkles className="w-6 h-6" />,
    iconColor: "#7c3aed",
    currency: "KSh",
    price: "9,000",
    period: "/ month",
    description: "Full reputation management. Completely handled.",
    popular: false,
    ctaLabel: "Get started",
    ctaHref: "#contact",
    features: [
      "Everything in Tap + Grow",
      "AI-drafted review responses",
      "Competitor review tracking",
      "Google Business post scheduling",
      "Quarterly strategy call + account manager",
    ],
  },
];

export function TapThrivePricingReact() {
  return (
    <CreativePricing
      tag="Simple pricing"
      title="Pick a plan. Live in 72 hours."
      description="One setup fee. One monthly plan. No contracts."
      tiers={tiers}
    />
  );
}
