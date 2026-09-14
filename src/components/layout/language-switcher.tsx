import { Languages } from "lucide-react";
import { setLanguage } from "@/app/actions/preferences";
import type { AppLanguage } from "@/lib/i18n";

export function LanguageSwitcher({ language, dark = false }: { language: AppLanguage; dark?: boolean }) {
  return <form action={setLanguage} className={`flex items-center gap-1 rounded-xl border p-1 ${dark ? "border-white/15" : "border-line"}`}>
    <Languages className={`mx-2 size-4 ${dark ? "text-white/55" : "text-coastal"}`} />
    {(["en", "zh"] as const).map((value) => <button key={value} name="language" value={value} aria-pressed={language === value} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${language === value ? (dark ? "bg-white text-navy" : "bg-navy text-white") : (dark ? "text-white/60" : "text-muted")}`}>{value === "en" ? "EN" : "中文"}</button>)}
  </form>;
}
