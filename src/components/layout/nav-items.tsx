import { Home, ClipboardCheck, KeyRound, ChartNoAxesCombined, Wrench, Library, Newspaper } from "lucide-react";

export const navGroups = [
  { label: "Property Hub", items: [
    { label: "Your Property", href: "/dashboard/property", icon: Home },
    { label: "Property Health Check", href: "/dashboard/health-check", icon: ClipboardCheck },
    { label: "Ready to Rent", href: "/dashboard/ready-to-rent", icon: KeyRound },
  ] },
  { label: "Insights", items: [
    { label: "Market Insights", href: "/dashboard/market-insights", icon: ChartNoAxesCombined },
    { label: "Tools", href: "/dashboard/tools", icon: Wrench },
    { label: "Resources", href: "/dashboard/resources", icon: Library },
    { label: "Blog", href: "/dashboard/blog", icon: Newspaper },
  ] },
] as const;
