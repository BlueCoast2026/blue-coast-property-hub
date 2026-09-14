"use server";

import { cookies } from "next/headers";
import { isLanguage, languageCookie } from "@/lib/i18n";

export async function setLanguage(formData: FormData) {
  const language = formData.get("language");
  if (!isLanguage(language)) return;
  (await cookies()).set(languageCookie, language, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
