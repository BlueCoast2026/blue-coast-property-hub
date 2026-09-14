export type AppLanguage = "en" | "zh";

export const languageCookie = "bcr_language";

export function isLanguage(value: unknown): value is AppLanguage {
  return value === "en" || value === "zh";
}

export function pick(language: AppLanguage, english: string, chinese: string) {
  return language === "zh" ? chinese : english;
}
