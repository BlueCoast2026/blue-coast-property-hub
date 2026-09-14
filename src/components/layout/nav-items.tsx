import { Home, ClipboardCheck, KeyRound, ChartNoAxesCombined, Wrench, Library, Newspaper, Scale } from "lucide-react";

const englishNavGroups = [
  { label: "Property Hub", items: [
    { label: "Your Property", href: "/dashboard/property", icon: Home },
    { label: "Property Health Check", href: "/dashboard/health-check", icon: ClipboardCheck },
    { label: "Ready to Rent", href: "/dashboard/ready-to-rent", icon: KeyRound },
    { label: "Property Decision Check", href: "/dashboard/property-decision", icon: Scale },
  ] },
  { label: "Insights", items: [
    { label: "Market Insights", href: "/dashboard/market-insights", icon: ChartNoAxesCombined },
    { label: "Tools", href: "/dashboard/tools", icon: Wrench },
    { label: "Resources", href: "/dashboard/resources", icon: Library },
    { label: "Blog", href: "/dashboard/blog", icon: Newspaper },
  ] },
] as const;

export function getNavGroups(language: "en" | "zh") {
  if (language === "en") return englishNavGroups;
  const labels = [["物业中心", ["您的物业", "物业健康检查", "出租准备检查", "物业决策检查"]], ["市场与资讯", ["市场洞察", "工具", "资源", "博客"]]] as const;
  return englishNavGroups.map((group, groupIndex) => ({ ...group, label: labels[groupIndex][0], items: group.items.map((item, itemIndex) => ({ ...item, label: labels[groupIndex][1][itemIndex] })) }));
}
