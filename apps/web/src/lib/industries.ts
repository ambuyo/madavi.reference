export const industryMap: Record<string, string> = {
  "accelerators-incubators": "Accelerators/Incubators",
  agriculture: "Agriculture",
  consortiums: "Consortiums",
  edtech: "Edtech",
  foundations: "Foundations",
  healthcare: "Healthcare",
  "legal-law-firms": "Legal & Law Firms",
  manufacturing: "Manufacturing",
  "non-profits": "Non Profits",
  "real-estate": "Real Estate",
  "retail-ecommerce": "Retail & Ecommerce",
  services: "Services",
  technology: "Technology",
  "venture-capital": "Venture Capital",
};

export function getIndustryDisplayName(value: string): string {
  return industryMap[value] || value;
}
