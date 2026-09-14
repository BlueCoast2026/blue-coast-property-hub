import "server-only";
import { cookies } from "next/headers";
import { isLanguage, languageCookie, type AppLanguage } from "./i18n";

export async function getLanguage(): Promise<AppLanguage> {
  const value = (await cookies()).get(languageCookie)?.value;
  return isLanguage(value) ? value : "en";
}
